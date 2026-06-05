import json
import bcrypt
from datetime import datetime, timedelta
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from pydantic import BaseModel, EmailStr, validator
from api.supabase_client import get_supabase

def get_user_from_cookies(request) -> tuple:
    # Check custom headers first (for mobile apps)
    user_id = request.headers.get('X-User-ID')
    user_role = request.headers.get('X-User-Role')
    if user_id and user_role:
        return user_id, user_role
    
    # Fallback: check Authorization header with token
    auth_header = request.headers.get('Authorization') or ''
    if auth_header.startswith('Bearer '):
        import base64
        try:
            token = auth_header.replace('Bearer ', '')
            decoded = base64.b64decode(token).decode()
            user_id = decoded.split(':')[0]
            user_role = decoded.split(':')[1] if len(decoded.split(':')) > 1 else None
            return user_id, user_role
        except:
            pass
    
    # Fall back to cookies (for web)
    user_id = request.COOKIES.get('user_id')
    user_role = request.COOKIES.get('user_role')
    return user_id, user_role

def json_body(request) -> dict:
    return json.loads(request.body) if request.body else {}

def log_activity(supabase, user_id: int, action: str, entity_type: str = None, entity_id: int = None):
    supabase.table('activity_logs').insert({
        'user_id': user_id,
        'action': action,
        'entity_type': entity_type,
        'entity_id': entity_id
    }).execute()

def create_notification(supabase, user_id: int, message: str, notif_type: str = 'INFO'):
    supabase.table('notifications').insert({
        'user_id': user_id,
        'message': message,
        'type': notif_type,
        'is_read': False
    }).execute()

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(View):
    def post(self, request):
        try:
            supabase = get_supabase()
            data = json_body(request)
            schema = LoginSchema(**data)
            
            result = supabase.table('users').select('*').eq('email', schema.email).execute()
            if not result.data:
                return JsonResponse({'error': 'Invalid credentials'}, status=401)
            
            user = result.data[0]
            if not user.get('is_active', True):
                return JsonResponse({'error': 'Account is deactivated. Please contact support.'}, status=403)
            
            if not bcrypt.checkpw(schema.password.encode(), user['password_hash'].encode()):
                return JsonResponse({'error': 'Invalid credentials'}, status=401)
            
            import time
            import base64
            
            auth_token_str = f"{user['id']}:{user['role']}:{int(time.time())}"
            auth_token = base64.b64encode(auth_token_str.encode()).decode()
            
            response = JsonResponse({
                'user': user, 
                'message': 'Login successful',
                'auth_token': auth_token,
                'user_id': user['id'],
                'user_role': user['role']
            }, status=200)
            
            host = request.get_host()
            is_localhost = host.startswith('localhost') or host.startswith('127.0.0.1')
            
            if is_localhost:
                # Localhost: no Secure
                response.set_cookie('user_id', str(user['id']), httponly=True, secure=False, samesite='Lax', max_age=60*60*24*7, path='/')
                response.set_cookie('user_role', user['role'], secure=False, samesite='Lax', max_age=60*60*24*7, path='/')
            else:
                # Production: SameSite=None for cross-origin (but no explicit domain)
                response.set_cookie('user_id', str(user['id']), httponly=True, secure=True, samesite='None', max_age=60*60*24*7, path='/')
                response.set_cookie('user_role', user['role'], secure=True, samesite='None', max_age=60*60*24*7, path='/')
            return response
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(View):
    def post(self, request):
        response = JsonResponse({'message': 'Logged out'}, status=200)
        
        host = request.get_host()
        is_localhost = host.startswith('localhost') or host.startswith('127.0.0.1')
        
        if is_localhost:
            response.delete_cookie('user_id', path='/', samesite='Lax')
            response.delete_cookie('user_role', path='/', samesite='Lax')
        else:
            response.delete_cookie('user_id', path='/', samesite='None')
            response.delete_cookie('user_role', path='/', samesite='None')
        return response

class RegisterSchema(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    
    @validator('password')
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(View):
    def post(self, request):
        try:
            supabase = get_supabase()
            data = json_body(request)
            schema = RegisterSchema(**data)
            
            hashed = bcrypt.hashpw(schema.password.encode(), bcrypt.gensalt()).decode()
            
            result = supabase.table('users').insert({
                'email': schema.email,
                'name': schema.name,
                'password_hash': hashed,
                'role': schema.role,
                'is_active': True
            }).execute()
            
            if not result.data:
                return JsonResponse({'error': 'Registration failed'}, status=400)
            
            user = result.data[0]
            
            if schema.role == 'PET_OWNER':
                supabase.table('pet_owners').insert({'user_id': user['id']}).execute()
            elif schema.role == 'STAFF':
                supabase.table('staff').insert({'user_id': user['id'], 'is_available': True}).execute()
            
            action = f'Created {schema.role.lower()} account'
            log_activity(supabase, user['id'], action, 'user', user['id'])
            
            response = JsonResponse({'user': user, 'message': 'Registration successful'}, status=201)
            response.set_cookie('user_id', str(user['id']), httponly=True, secure=False, samesite=None, max_age=60*60*24*7, path='/')
            response.set_cookie('user_role', user['role'], secure=False, samesite=None, max_age=60*60*24*7, path='/')
            return response
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class MeView(View):
    def get(self, request):
        user_id, _ = get_user_from_cookies(request)
        
        # Fallback: check Authorization header with token
        if not user_id:
            auth_header = request.headers.get('Authorization') or ''
            if auth_header.startswith('Bearer '):
                import base64
                try:
                    token = auth_header.replace('Bearer ', '')
                    decoded = base64.b64decode(token).decode()
                    user_id = decoded.split(':')[0]
                except:
                    pass
        
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        result = supabase.table('users').select('id, email, name, role, is_active, created_at').eq('id', int(user_id)).execute()
        
        if not result.data:
            return JsonResponse({'error': 'User not found'}, status=404)
        
        return JsonResponse({'user': result.data[0]})

@method_decorator(csrf_exempt, name='dispatch')
class UsersView(View):
    def get(self, request):
        _, user_role = get_user_from_cookies(request)
        if user_role != 'ADMIN':
            return JsonResponse({'error': 'Forbidden'}, status=403)
        
        supabase = get_supabase()
        role = request.GET.get('role')
        query = supabase.table('users').select('id, email, name, role, is_active, created_at')
        
        if role:
            query = query.eq('role', role)
        
        result = query.execute()
        return JsonResponse({'users': result.data})
    
    def patch(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        user_id_param = data.get('id')
        
        if not user_id_param:
            return JsonResponse({'error': 'User ID required'}, status=400)
        
        updates = {k: v for k, v in data.items() if k not in ('id', 'currentPassword', 'newPassword')}
        
        if 'password' in updates:
            updates['password_hash'] = bcrypt.hashpw(updates['password'].encode(), bcrypt.gensalt()).decode()
        
        updates['updated_at'] = datetime.utcnow().isoformat()
        
        result = supabase.table('users').update(updates).eq('id', user_id_param).execute()
        
        if result.data:
            log_activity(supabase, int(user_id), 'Updated user', 'user', user_id_param)
        
        return JsonResponse({'user': result.data[0] if result.data else {}})

@method_decorator(csrf_exempt, name='dispatch')
class PetsView(View):
    def get(self, request):
        user_id, user_role = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        query = supabase.table('pets').select('*')
        
        if user_role == 'PET_OWNER':
            owner_result = supabase.table('pet_owners').select('id').eq('user_id', int(user_id)).execute()
            if owner_result.data:
                query = query.eq('owner_id', owner_result.data[0]['id'])
        
        result = query.execute()
        return JsonResponse({'pets': result.data})
    
    def post(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        
        owner_result = supabase.table('pet_owners').select('id').eq('user_id', int(user_id)).execute()
        if not owner_result.data:
            return JsonResponse({'error': 'Owner profile not found'}, status=404)
        
        data['owner_id'] = owner_result.data[0]['id']
        result = supabase.table('pets').insert(data).execute()
        
        if result.data:
            log_activity(supabase, int(user_id), 'Created pet', 'pet', result.data[0]['id'])
        
        return JsonResponse({'pet': result.data[0]}, status=201)
    
    def patch(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        pet_id = data.pop('id', None) or request.GET.get('id')
        
        if not pet_id:
            return JsonResponse({'error': 'Pet ID required'}, status=400)
        
        result = supabase.table('pets').update(data).eq('id', int(pet_id)).execute()
        
        if result.data:
            log_activity(supabase, int(user_id), 'Updated pet', 'pet', int(pet_id))
        
        return JsonResponse({'pet': result.data[0] if result.data else {}})
    
    def delete(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        pet_id = request.GET.get('id')
        if not pet_id:
            return JsonResponse({'error': 'Pet ID required'}, status=400)
        
        supabase = get_supabase()
        supabase.table('pets').update({'is_active': False}).eq('id', int(pet_id)).execute()
        
        log_activity(supabase, int(user_id), 'Archived pet', 'pet', int(pet_id))
        
        return JsonResponse({'success': True})

@method_decorator(csrf_exempt, name='dispatch')
class AppointmentsView(View):
    def get(self, request):
        user_id, user_role = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        query = supabase.table('appointments').select('*, pets(name, species), staff(*, users(name)), pet_owners!inner(user_id, users!inner(name))')
        
        if user_role == 'PET_OWNER':
            owner_result = supabase.table('pet_owners').select('id').eq('user_id', int(user_id)).execute()
            if owner_result.data:
                query = query.eq('owner_id', owner_result.data[0]['id'])
        elif user_role == 'STAFF':
            staff_result = supabase.table('staff').select('id').eq('user_id', int(user_id)).execute()
            if staff_result.data:
                staff_id = staff_result.data[0]['id']
                query = query.or_(f'staff_id.eq.{staff_id},staff_id.is.null')
        
        result = query.execute()
        return JsonResponse({'appointments': result.data})
    
    def post(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        
        owner_result = supabase.table('pet_owners').select('id').eq('user_id', int(user_id)).execute()
        if not owner_result.data:
            return JsonResponse({'error': 'Owner profile not found'}, status=404)
        
        data['owner_id'] = owner_result.data[0]['id']
        data['status'] = 'PENDING'
        
        result = supabase.table('appointments').insert(data).execute()
        
        if result.data:
            appointment = result.data[0]
            log_activity(supabase, int(user_id), 'Booked appointment', 'appointment', appointment['id'])
            
            staff_result = supabase.table('staff').select('user_id').limit(1).execute()
            if staff_result.data:
                create_notification(
                    supabase,
                    staff_result.data[0]['user_id'],
                    f"New appointment booked for {appointment['appointment_date']} at {appointment['start_time']}",
                    'APPOINTMENT'
                )
        
        return JsonResponse({'appointment': result.data[0]}, status=201)
    
    def patch(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        appointment_id = data.pop('id', None)
        
        if not appointment_id:
            return JsonResponse({'error': 'Appointment ID required'}, status=400)
        
        result = supabase.table('appointments').update(data).eq('id', appointment_id).execute()
        
        if result.data:
            appointment = result.data[0]
            action = f"Updated appointment status to {data.get('status')}" if data.get('status') else 'Updated appointment'
            log_activity(supabase, int(user_id), action, 'appointment', appointment_id)
            
            if data.get('status'):
                # Get owner user_id from pet_owners relationship
                owner_result = supabase.table('pet_owners').select('user_id').eq('id', appointment['owner_id']).execute()
                if owner_result.data:
                    owner_user_id = owner_result.data[0]['user_id']
                    create_notification(
                        supabase,
                        owner_user_id,
                        f"Your appointment has been {data['status'].lower()}",
                        'APPOINTMENT'
                    )
        
        return JsonResponse({'appointment': result.data[0]})
    
    def delete(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        appointment_id = request.GET.get('id')
        if not appointment_id:
            return JsonResponse({'error': 'Appointment ID required'}, status=400)
        
        supabase = get_supabase()
        supabase.table('appointments').update({'is_active': False}).eq('id', int(appointment_id)).execute()
        
        log_activity(supabase, int(user_id), 'Archived appointment', 'appointment', int(appointment_id))
        
        return JsonResponse({'success': True})

@method_decorator(csrf_exempt, name='dispatch')
class HealthRecordsView(View):
    def get(self, request):
        user_id, user_role = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        query = supabase.table('health_records').select('*, pets(name, species), staff(*, users(name))')
        
        if user_role == 'PET_OWNER':
            owner_result = supabase.table('pet_owners').select('id').eq('user_id', int(user_id)).execute()
            if not owner_result.data:
                return JsonResponse({'records': []})
            pet_result = supabase.table('pets').select('id').eq('owner_id', owner_result.data[0]['id']).execute()
            if not pet_result.data:
                return JsonResponse({'records': []})
            query = query.in_('pet_id', [p['id'] for p in pet_result.data])
        
        result = query.execute()
        return JsonResponse({'records': result.data})
    
    def post(self, request):
        user_id, user_role = get_user_from_cookies(request)
        if not user_id or user_role == 'PET_OWNER':
            return JsonResponse({'error': 'Unauthorized'}, status=403)
        
        supabase = get_supabase()
        data = json_body(request)
        
        if data.get('health_record_id'):
            result = supabase.table('prescriptions').insert(data).execute()
            if result.data:
                log_activity(supabase, int(user_id), 'Created prescription', 'prescription', result.data[0]['id'])
            return JsonResponse({'prescription': result.data[0]}, status=201)
        
        staff_result = supabase.table('staff').select('id').eq('user_id', int(user_id)).execute()
        if staff_result.data:
            data['recorded_by_staff_id'] = staff_result.data[0]['id']
        
        result = supabase.table('health_records').insert(data).execute()
        
        if result.data:
            log_activity(supabase, int(user_id), 'Created health record', 'health_record', result.data[0]['id'])
        
        return JsonResponse({'record': result.data[0]}, status=201)
    
    def put(self, request):
        user_id, user_role = get_user_from_cookies(request)
        if not user_id or user_role == 'PET_OWNER':
            return JsonResponse({'error': 'Unauthorized'}, status=403)
        
        supabase = get_supabase()
        data = json_body(request)
        record_id = data.get('id') or request.GET.get('id')
        
        if not record_id:
            return JsonResponse({'error': 'Record ID required'}, status=400)
        
        result = supabase.table('health_records').update(data).eq('id', int(record_id)).execute()
        
        if result.data:
            log_activity(supabase, int(user_id), 'Updated health record', 'health_record', record_id)
            record_id_val = result.data[0].get('id')
            updated = supabase.table('health_records').select('*, pets(name, species), staff(*, users(name))').eq('id', record_id_val).execute()
            return JsonResponse({'record': updated.data[0] if updated.data else result.data[0]})
        
        return JsonResponse({'record': result.data[0]})
    
    def patch(self, request):
        user_id, user_role = get_user_from_cookies(request)
        if not user_id or user_role == 'PET_OWNER':
            return JsonResponse({'error': 'Unauthorized'}, status=403)
        
        supabase = get_supabase()
        data = json_body(request)
        record_id = request.GET.get('id')
        
        if not record_id:
            return JsonResponse({'error': 'Record ID required'}, status=400)
        
        result = supabase.table('health_records').update(data).eq('id', int(record_id)).execute()
        
        if result.data:
            log_activity(supabase, int(user_id), 'Archived health record', 'health_record', int(record_id))
            return JsonResponse({'record': result.data[0]})
        
        return JsonResponse({'error': 'Not found'}, status=404)
    
    def delete(self, request):
        user_id, user_role = get_user_from_cookies(request)
        if not user_id or user_role == 'PET_OWNER':
            return JsonResponse({'error': 'Unauthorized'}, status=403)
        
        supabase = get_supabase()
        record_id = request.GET.get('id')
        
        if not record_id:
            return JsonResponse({'error': 'Record ID required'}, status=400)
        
        result = supabase.table('health_records').update({'is_active': False}).eq('id', int(record_id)).execute()
        
        if result.data:
            log_activity(supabase, int(user_id), 'Archived health record', 'health_record', int(record_id))
        
        return JsonResponse({'success': True})

@method_decorator(csrf_exempt, name='dispatch')
class PrescriptionsView(View):
    def get(self, request):
        user_id, user_role = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        query = supabase.table('prescriptions').select('*, pets(name, species), health_records(diagnosis)')
        
        if user_role == 'PET_OWNER':
            owner_result = supabase.table('pet_owners').select('id').eq('user_id', int(user_id)).execute()
            if not owner_result.data:
                return JsonResponse({'prescriptions': []})
            pet_result = supabase.table('pets').select('id').eq('owner_id', owner_result.data[0]['id']).execute()
            if not pet_result.data:
                return JsonResponse({'prescriptions': []})
            query = query.in_('pet_id', [p['id'] for p in pet_result.data])
        
        result = query.execute()
        return JsonResponse({'prescriptions': result.data})
    
    def post(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        result = supabase.table('prescriptions').insert(data).execute()
        
        if result.data:
            log_activity(supabase, int(user_id), 'Created prescription', 'prescription', result.data[0]['id'])
        
        return JsonResponse({'prescription': result.data[0]}, status=201)
    
    def patch(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        pres_id = request.GET.get('id')
        
        if not pres_id:
            return JsonResponse({'error': 'Prescription ID required'}, status=400)
        
        result = supabase.table('prescriptions').update(data).eq('id', int(pres_id)).execute()
        
        if result.data and data.get('scheduled_at'):
            try:
                pet_info = supabase.table('prescriptions').select('*, pets(name, species), health_records(diagnosis)').eq('id', int(pres_id)).execute()
                if pet_info.data:
                    prescription = pet_info.data[0]
                    pet_name = prescription.get('pets', {}).get('name', f"Pet #{prescription.get('pet_id')}")
                    owner_result = supabase.table('pets').select('owner_id').eq('id', prescription.get('pet_id')).execute()
                    if owner_result.data:
                        owner = supabase.table('pet_owners').select('user_id').eq('id', owner_result.data[0]['owner_id']).execute()
                        if owner.data:
                            owner_user_id = owner.data[0]['user_id']
                            create_notification(
                                supabase,
                                owner_user_id,
                                f"Medication reminder set for {prescription.get('medication_name')} ({pet_name}) at {data.get('scheduled_at')}",
                                'PRESCRIPTION'
                            )
            except Exception:
                pass
        
        return JsonResponse({'prescription': result.data[0]})
    
    def put(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        
        pres_id = request.GET.get('id')
        if not pres_id:
            return JsonResponse({'error': 'Prescription ID required'}, status=400)
        
        result = supabase.table('prescriptions').update(data).eq('id', int(pres_id)).execute()
        if result.data:
            return JsonResponse({'prescription': result.data[0]})
        return JsonResponse({'error': 'Not found'}, status=404)
    
    def delete(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        pres_id = request.GET.get('id')
        
        if not pres_id:
            return JsonResponse({'error': 'Prescription ID required'}, status=400)
        
        result = supabase.table('prescriptions').update({'is_active': False}).eq('id', int(pres_id)).execute()
        
        if result.data:
            log_activity(supabase, int(user_id), 'Archived prescription', 'prescription', int(pres_id))
        
        return JsonResponse({'success': True})

@method_decorator(csrf_exempt, name='dispatch')
class VaccinationsView(View):
    def get(self, request):
        user_id, user_role = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        query = supabase.table('vaccinations').select('*, pets(name, species)')
        
        if user_role == 'PET_OWNER':
            owner_result = supabase.table('pet_owners').select('id').eq('user_id', int(user_id)).execute()
            if not owner_result.data:
                return JsonResponse({'vaccinations': []})
            pet_result = supabase.table('pets').select('id').eq('owner_id', owner_result.data[0]['id']).execute()
            if not pet_result.data:
                return JsonResponse({'vaccinations': []})
            query = query.in_('pet_id', [p['id'] for p in pet_result.data])
        
        result = query.execute()
        return JsonResponse({'vaccinations': result.data})
    
    def post(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        result = supabase.table('vaccinations').insert(data).execute()
        
        if result.data:
            log_activity(supabase, int(user_id), 'Added vaccination', 'vaccination', result.data[0]['id'])
        
        return JsonResponse({'vaccination': result.data[0]}, status=201)
    
    def patch(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        vacc_id = request.GET.get('id')
        
        if not vacc_id:
            return JsonResponse({'error': 'Vaccination ID required'}, status=400)
        
        result = supabase.table('vaccinations').update(data).eq('id', int(vacc_id)).execute()
        return JsonResponse({'vaccination': result.data[0]})
    
    def put(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        
        vacc_id = request.GET.get('id')
        if not vacc_id:
            return JsonResponse({'error': 'Vaccination ID required'}, status=400)
        
        result = supabase.table('vaccinations').update(data).eq('id', int(vacc_id)).execute()
        if result.data:
            return JsonResponse({'vaccination': result.data[0]})
        return JsonResponse({'error': 'Not found'}, status=404)
    
    def delete(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        vacc_id = request.GET.get('id')
        
        if not vacc_id:
            return JsonResponse({'error': 'Vaccination ID required'}, status=400)
        
        result = supabase.table('vaccinations').update({'is_active': False}).eq('id', int(vacc_id)).execute()
        
        if result.data:
            log_activity(supabase, int(user_id), 'Archived vaccination', 'vaccination', int(vacc_id))
        
        return JsonResponse({'success': True})

@method_decorator(csrf_exempt, name='dispatch')
class StaffView(View):
    def get(self, request):
        supabase = get_supabase()
        result = supabase.table('staff').select('*, users:user_id(name, email), staff_availability(*)').eq('is_available', True).execute()
        return JsonResponse({'staff': result.data})

@method_decorator(csrf_exempt, name='dispatch')
class StaffAvailabilityView(View):
    def get(self, request):
        supabase = get_supabase()
        result = supabase.table('staff_availability').select('*').execute()
        return JsonResponse({'availability': result.data})
    
    def post(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        result = supabase.table('staff_availability').insert(data).execute()
        
        return JsonResponse({'availability': result.data[0]}, status=201)
    
    def patch(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        avail_id = data.pop('id', None)
        
        if not avail_id:
            return JsonResponse({'error': 'Availability ID required'}, status=400)
        
        result = supabase.table('staff_availability').update(data).eq('id', avail_id).execute()
        return JsonResponse({'availability': result.data[0]})
    
    def delete(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        avail_id = request.GET.get('id')
        if not avail_id:
            return JsonResponse({'error': 'Availability ID required'}, status=400)
        
        supabase = get_supabase()
        supabase.table('staff_availability').delete().eq('id', int(avail_id)).execute()
        
        return JsonResponse({'success': True})

@method_decorator(csrf_exempt, name='dispatch')
class CamerasView(View):
    def get(self, request):
        user_id, user_role = get_user_from_cookies(request)
        
        supabase = get_supabase()
        
        if user_role == 'PET_OWNER' and user_id:
            owner_result = supabase.table('pet_owners').select('id').eq('user_id', int(user_id)).execute()
            if not owner_result.data:
                return JsonResponse({'cameras': []})
            pet_result = supabase.table('pets').select('id').eq('owner_id', owner_result.data[0]['id']).execute()
            if not pet_result.data:
                return JsonResponse({'cameras': []})
            pet_ids = [p['id'] for p in pet_result.data]
            loc_result = supabase.table('pet_locations').select('room_id').in_('pet_id', pet_ids).execute()
            if not loc_result.data:
                return JsonResponse({'cameras': []})
            room_ids = list(set([loc['room_id'] for loc in loc_result.data]))
            result = supabase.table('cameras').select('*, rooms(name)').in_('room_id', room_ids).execute()
            return JsonResponse({'cameras': result.data})
        
        result = supabase.table('cameras').select('*, rooms(name)').execute()
        return JsonResponse({'cameras': result.data})
    
    def post(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        data['is_active'] = data.get('is_active', True)
        result = supabase.table('cameras').insert(data).execute()
        
        if result.data:
            log_activity(supabase, int(user_id), 'Registered camera', 'camera', result.data[0]['id'])
        
        return JsonResponse({'camera': result.data[0]}, status=201)
    
    def put(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        camera_id = request.GET.get('id')
        if not camera_id:
            return JsonResponse({'error': 'Camera ID required'}, status=400)
        
        supabase = get_supabase()
        data = json_body(request)
        data['updated_at'] = datetime.utcnow().isoformat()
        
        result = supabase.table('cameras').update(data).eq('id', int(camera_id)).execute()
        
        if result.data:
            log_activity(supabase, int(user_id), 'Updated camera', 'camera', int(camera_id))
        
        return JsonResponse({'camera': result.data[0]})
    
    def patch(self, request):
            user_id, _ = get_user_from_cookies(request)
            if not user_id:
                return JsonResponse({'error': 'Unauthorized'}, status=401)
            
            camera_id = request.GET.get('id')
            if not camera_id:
                return JsonResponse({'error': 'Camera ID required'}, status=400)
            
            supabase = get_supabase()
            data = json_body(request) or {}
            result = supabase.table('cameras').update(data).eq('id', int(camera_id)).execute()
            
            if result.data:
                log_activity(supabase, int(user_id), 'Updated camera', 'camera', int(camera_id))
            
            return JsonResponse({'camera': result.data[0] if result.data else {}})

    def delete(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
         
        camera_id = request.GET.get('id')
        if not camera_id:
            return JsonResponse({'error': 'Camera ID required'}, status=400)
         
        supabase = get_supabase()
        supabase.table('cameras').update({'is_active': False}).eq('id', int(camera_id)).execute()
         
        log_activity(supabase, int(user_id), 'Archived camera', 'camera', int(camera_id))
         
        return JsonResponse({'success': True})

@method_decorator(csrf_exempt, name='dispatch')
class NotificationsView(View):
    def get(self, request):
        user_id, user_role = get_user_from_cookies(request)
        
        supabase = get_supabase()
        query = supabase.table('notifications').select('*').order('created_at', desc=True).limit(50)
        
        if user_role != 'ADMIN' and user_id:
            query = query.eq('user_id', int(user_id))
        
        result = query.execute()
        return JsonResponse({'notifications': result.data})
    
    def post(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        
        if not data.get('user_id') or not data.get('message'):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
        
        data['type'] = data.get('type', 'INFO')
        data['is_read'] = False
        
        result = supabase.table('notifications').insert(data).execute()
        return JsonResponse({'notification': result.data[0]})
    
    def patch(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        
        if data.get('mark_all_read'):
            supabase.table('notifications').update({'is_read': True}).eq('user_id', int(user_id)).execute()
        elif data.get('id'):
            supabase.table('notifications').update({'is_read': True}).eq('id', data['id']).execute()
        
        return JsonResponse({'success': True})

@method_decorator(csrf_exempt, name='dispatch')
class RoomsView(View):
    def get(self, request):
        supabase = get_supabase()
        result = supabase.table('rooms').select('*').order('name').execute()
        return JsonResponse({'rooms': result.data})
    
    def post(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        
        if not data.get('name'):
            return JsonResponse({'error': 'Room name required'}, status=400)
        
        result = supabase.table('rooms').insert(data).execute()
        
        if result.data:
            log_activity(supabase, int(user_id), 'Created room', 'room', result.data[0]['id'])
        
        return JsonResponse({'room': result.data[0]}, status=201)
    
    def put(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        room_id = request.GET.get('id')
        if not room_id:
            return JsonResponse({'error': 'Room ID required'}, status=400)
        
        supabase = get_supabase()
        data = json_body(request)
        
        result = supabase.table('rooms').update(data).eq('id', int(room_id)).execute()
        
        if result.data:
            log_activity(supabase, int(user_id), 'Updated room', 'room', int(room_id))
        
        return JsonResponse({'room': result.data[0]})
    
    def patch(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        room_id = request.GET.get('id')
        if not room_id:
            return JsonResponse({'error': 'Room ID required'}, status=400)
        
        supabase = get_supabase()
        data = json_body(request) or {}
        result = supabase.table('rooms').update(data).eq('id', int(room_id)).execute()
        
        if result.data:
            log_activity(supabase, int(user_id), 'Archived room', 'room', int(room_id))
        return JsonResponse({'room': result.data[0]})

@method_decorator(csrf_exempt, name='dispatch')
class PetLocationsView(View):
    def get(self, request):
        supabase = get_supabase()
        result = supabase.table('pet_locations').select('*, pets(name), rooms(name)').execute()
        return JsonResponse({'locations': result.data})
    
    def post(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        result = supabase.table('pet_locations').insert(data).execute()
        
        return JsonResponse({'location': result.data[0]}, status=201)
    
    def patch(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request) or {}
        loc_id = data.pop('id', None) or request.GET.get('id')
        
        if not loc_id:
            return JsonResponse({'error': 'Location ID required'}, status=400)
        
        result = supabase.table('pet_locations').update(data).eq('id', int(loc_id)).execute()
        return JsonResponse({'location': result.data[0]})
    
    def put(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        loc_id = data.get('id') or request.GET.get('id')
        
        if not loc_id:
            return JsonResponse({'error': 'Location ID required'}, status=400)
        
        result = supabase.table('pet_locations').update(data).eq('id', int(loc_id)).execute()
        return JsonResponse({'location': result.data[0]})
    
    def delete(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        loc_id = request.GET.get('id')
        
        if not loc_id:
            return JsonResponse({'error': 'Location ID required'}, status=400)
        
        result = supabase.table('pet_locations').delete().eq('id', int(loc_id)).execute()
        
        return JsonResponse({'success': True})

@method_decorator(csrf_exempt, name='dispatch')
class ActivityLogsView(View):
    def get(self, request):
        supabase = get_supabase()
        result = supabase.table('activity_logs').select('*, users(name, email)').order('created_at', desc=True).limit(100).execute()
        return JsonResponse({'logs': result.data})
    
    def post(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        
        if not data.get('action'):
            return JsonResponse({'error': 'Action required'}, status=400)
        
        data['user_id'] = int(user_id)
        result = supabase.table('activity_logs').insert(data).execute()
        
        return JsonResponse({'log': result.data[0]})

@method_decorator(csrf_exempt, name='dispatch')
class DashboardStatsView(View):
    def get(self, request):
        user_id, user_role = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        supabase = get_supabase()
        today = datetime.utcnow().date().isoformat()
        tomorrow = (datetime.utcnow() + timedelta(days=1)).date().isoformat()
        result = {}

        if user_role == 'ADMIN':
            # Stats
            users_count = supabase.table('users').select('id', count='exact', head=True).execute()
            pets_count = supabase.table('pets').select('id', count='exact', head=True).execute()
            appointments_today = supabase.table('appointments').select('id', count='exact', head=True).gte('appointment_date', today).lt('appointment_date', tomorrow).execute()
            health_records_count = supabase.table('health_records').select('id', count='exact', head=True).execute()

            result['stats'] = {
                'totalUsers': users_count.count or 0,
                'totalPets': pets_count.count or 0,
                'appointmentsToday': appointments_today.count or 0,
                'healthRecords': health_records_count.count or 0,
            }

            # Recent users
            recent_users = supabase.table('users').select('id,name,email,role,is_active,created_at').order('created_at', desc=True).limit(5).execute()
            result['recentUsers'] = recent_users.data or []

            # Recent pets with owner names
            recent_pets = supabase.table('pets').select('id,name,species,breed,owner_id,created_at').order('created_at', desc=True).limit(5).execute()
            pets_data = recent_pets.data or []
            owner_ids = list(set(p['owner_id'] for p in pets_data if p.get('owner_id')))
            owner_map = {}
            if owner_ids:
                pet_owners = supabase.table('pet_owners').select('id,user_id').in_('id', owner_ids).execute()
                if pet_owners.data:
                    uids = list(set(po['user_id'] for po in pet_owners.data))
                    users = supabase.table('users').select('id,name').in_('id', uids).execute()
                    user_map = {u['id']: u['name'] for u in (users.data or [])}
                    for po in pet_owners.data:
                        owner_map[po['id']] = user_map.get(po['user_id'], 'Unknown')
            for pet in pets_data:
                pet['owner_name'] = owner_map.get(pet.get('owner_id'), 'Unknown')
            result['recentPets'] = pets_data

            # Today's appointments
            today_appts = supabase.table('appointments').select('id,pet_id,owner_id,staff_id,appointment_date,start_time,end_time,status').gte('appointment_date', today).lt('appointment_date', tomorrow).order('start_time').limit(10).execute()
            appts_data = today_appts.data or []
            pet_ids = list(set(a['pet_id'] for a in appts_data if a.get('pet_id')))
            owner_ids = list(set(a['owner_id'] for a in appts_data if a.get('owner_id')))
            pet_name_map = {}
            if pet_ids:
                pets = supabase.table('pets').select('id,name').in_('id', pet_ids).execute()
                pet_name_map = {p['id']: p['name'] for p in (pets.data or [])}
            owner_name_map = {}
            if owner_ids:
                owner_po = supabase.table('pet_owners').select('id,user_id').in_('id', owner_ids).execute()
                if owner_po.data:
                    uids = list(set(po['user_id'] for po in owner_po.data))
                    users = supabase.table('users').select('id,name').in_('id', uids).execute()
                    user_map = {u['id']: u['name'] for u in (users.data or [])}
                    for po in owner_po.data:
                        owner_name_map[po['id']] = user_map.get(po['user_id'], 'Unknown')
            for apt in appts_data:
                apt['pet_name'] = pet_name_map.get(apt.get('pet_id'), 'Unknown')
                apt['owner_name'] = owner_name_map.get(apt.get('owner_id'), 'Unknown')
            result['todayAppointments'] = appts_data

            # Recent health records with pet names
            recent_records = supabase.table('health_records').select('id,pet_id,diagnosis,created_at').order('created_at', desc=True).limit(5).execute()
            records_data = recent_records.data or []
            pet_ids = list(set(r['pet_id'] for r in records_data if r.get('pet_id')))
            if pet_ids:
                pets = supabase.table('pets').select('id,name').in_('id', pet_ids).execute()
                pet_name_map = {p['id']: p['name'] for p in (pets.data or [])}
            for rec in records_data:
                rec['pet_name'] = pet_name_map.get(rec.get('pet_id'), 'Unknown')
            result['recentHealthRecords'] = records_data

        elif user_role == 'STAFF':
            staff_result = supabase.table('staff').select('id').eq('user_id', user_id).execute()
            if not staff_result.data:
                return JsonResponse({'error': 'Staff not found'}, status=404)
            staff_id = staff_result.data[0]['id']

            # Upcoming appointments for this staff
            upcoming = supabase.table('appointments').select('id,pet_id,owner_id,appointment_date,start_time,end_time,status').gte('appointment_date', today).in_('status', ['PENDING', 'CONFIRMED']).eq('staff_id', staff_id).order('appointment_date').order('start_time').limit(5).execute()
            appts_data = upcoming.data or []
            pet_ids = list(set(a['pet_id'] for a in appts_data if a.get('pet_id')))
            if pet_ids:
                pets = supabase.table('pets').select('id,name').in_('id', pet_ids).execute()
                pet_name_map = {p['id']: p['name'] for p in (pets.data or [])}
            else:
                pet_name_map = {}
            for apt in appts_data:
                apt['pet_name'] = pet_name_map.get(apt.get('pet_id'), 'Unknown')
            result['upcomingAppointments'] = appts_data

            # Recent health records by this staff
            recent_records = supabase.table('health_records').select('id,pet_id,diagnosis,created_at').eq('recorded_by_staff_id', staff_id).order('created_at', desc=True).limit(5).execute()
            records_data = recent_records.data or []
            pet_ids = list(set(r['pet_id'] for r in records_data if r.get('pet_id')))
            if pet_ids:
                pets = supabase.table('pets').select('id,name').in_('id', pet_ids).execute()
                pet_name_map = {p['id']: p['name'] for p in (pets.data or [])}
            for rec in records_data:
                rec['pet_name'] = pet_name_map.get(rec.get('pet_id'), 'Unknown')
            result['recentHealthRecords'] = records_data

            # Monitored pets (not discharged)
            monitored = supabase.table('pet_locations').select('id,pet_id,room_id,status').neq('status', 'DISCHARGED').execute()
            monitored_data = monitored.data or []
            pet_ids = list(set(m['pet_id'] for m in monitored_data if m.get('pet_id')))
            room_ids = list(set(m['room_id'] for m in monitored_data if m.get('room_id')))
            pet_info_map = {}
            if pet_ids:
                pets = supabase.table('pets').select('id,name,species').in_('id', pet_ids).execute()
                pet_info_map = {p['id']: p for p in (pets.data or [])}
            room_name_map = {}
            if room_ids:
                rooms = supabase.table('rooms').select('id,name').in_('id', room_ids).execute()
                room_name_map = {r['id']: r['name'] for r in (rooms.data or [])}
            for loc in monitored_data:
                info = pet_info_map.get(loc.get('pet_id'), {})
                loc['pet_name'] = info.get('name', 'Unknown')
                loc['species'] = info.get('species', 'Unknown')
                loc['room_name'] = room_name_map.get(loc.get('room_id'))
            result['monitoredPets'] = monitored_data

            # Stats
            appts_count = supabase.table('appointments').select('id', count='exact', head=True).eq('staff_id', staff_id).gte('appointment_date', today).in_('status', ['PENDING', 'CONFIRMED']).execute()
            result['stats'] = {
                'upcomingAppointments': appts_count.count or 0,
                'monitoredPets': len(monitored_data),
            }

        elif user_role == 'PET_OWNER':
            owner_result = supabase.table('pet_owners').select('id').eq('user_id', user_id).execute()
            if not owner_result.data:
                return JsonResponse({'error': 'Pet owner not found'}, status=404)
            owner_id = owner_result.data[0]['id']

            # My pets
            my_pets = supabase.table('pets').select('id,name,species,breed,created_at').eq('owner_id', owner_id).limit(5).execute()
            result['myPets'] = my_pets.data or []

            # Upcoming appointments
            upcoming = supabase.table('appointments').select('id,pet_id,staff_id,appointment_date,start_time,end_time,status').gte('appointment_date', today).eq('owner_id', owner_id).in_('status', ['PENDING', 'CONFIRMED']).order('appointment_date').order('start_time').limit(5).execute()
            appts_data = upcoming.data or []
            pet_ids = list(set(a['pet_id'] for a in appts_data if a.get('pet_id')))
            if pet_ids:
                pets = supabase.table('pets').select('id,name').in_('id', pet_ids).execute()
                pet_name_map = {p['id']: p['name'] for p in (pets.data or [])}
            for apt in appts_data:
                apt['pet_name'] = pet_name_map.get(apt.get('pet_id'), 'Unknown')
            result['upcomingAppointments'] = appts_data

            # Recent health records for my pets
            pet_ids = [p['id'] for p in (my_pets.data or [])]
            if pet_ids:
                recent_records = supabase.table('health_records').select('id,pet_id,diagnosis,created_at').in_('pet_id', pet_ids).order('created_at', desc=True).limit(5).execute()
                records_data = recent_records.data or []
                pet_map = {p['id']: p['name'] for p in (my_pets.data or [])}
                for rec in records_data:
                    rec['pet_name'] = pet_map.get(rec.get('pet_id'), 'Unknown')
                result['recentHealthRecords'] = records_data
            else:
                result['recentHealthRecords'] = []

            result['stats'] = {
                'totalPets': len(my_pets.data or []),
                'upcomingAppointments': len(appts_data),
            }

        return JsonResponse(result)

@method_decorator(csrf_exempt, name='dispatch')
class AnalyticsView(View):
    def get(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        start_date = request.GET.get('startDate')
        end_date = request.GET.get('endDate')
        
        date_filter = ''
        if start_date and end_date:
            date_filter = f" created_at.gte.{start_date}T00:00:00,created_at.lte.{end_date}T23:59:59"
        elif start_date:
            date_filter = f" created_at.gte.{start_date}T00:00:00"
        elif end_date:
            date_filter = f" created_at.lte.{end_date}T23:59:59"
        
        stats = {}
        
        result = supabase.table('pets').select('id', count='exact', head=True).execute()
        stats['overview'] = {'totalPets': result.count or 0}
        
        result = supabase.table('appointments').select('id', count='exact', head=True).execute()
        stats['overview']['totalAppointments'] = result.count or 0
        
        today = datetime.now().strftime('%Y-%m-%d')
        result = supabase.table('appointments').select('id', count='exact', head=True).eq('appointment_date', today).execute()
        stats['overview']['todayAppointments'] = result.count or 0
        
        result = supabase.table('staff').select('id', count='exact', head=True).eq('is_available', True).execute()
        stats['overview']['activeStaff'] = result.count or 0
        
        result = supabase.table('pet_locations').select('id', count='exact', head=True).execute()
        stats['overview']['petsMonitoring'] = result.count or 0
        
        result = supabase.table('appointments').select('appointment_date, status').execute()
        status_counts = {}
        trend_data = {}
        for r in result.data:
            date = r.get('appointment_date', '')
            status = r.get('status', 'UNKNOWN')
            status_counts[status] = status_counts.get(status, 0) + 1
            if not date:
                continue
            if date not in trend_data:
                trend_data[date] = {'total': 0, 'completed': 0, 'pending': 0}
            trend_data[date]['total'] += 1
            if status == 'COMPLETED':
                trend_data[date]['completed'] += 1
            elif status == 'PENDING' or status == 'CONFIRMED':
                trend_data[date]['pending'] += 1
        
        stats['charts'] = {
            'appointmentsByStatus': [{'status': k, 'count': v} for k, v in status_counts.items()],
            'appointmentsTrend': [{'date': k, **v} for k, v in sorted(trend_data.items())],
            'petsBySpecies': [],
            'staffPerformance': [],
            'roomsUtilization': [],
        }
        
        result = supabase.table('pets').select('species').execute()
        species_counts = {}
        for r in result.data:
            s = r.get('species', 'Unknown')
            species_counts[s] = species_counts.get(s, 0) + 1
        stats['charts']['petsBySpecies'] = [{'species': k, 'count': v} for k, v in species_counts.items()]
        
        result = supabase.table('rooms').select('id, name').execute()
        for r in result.data:
            room_name = r.get('name', 'Unknown')
            room_id = r.get('id')
            locs = supabase.table('pet_locations').select('id', count='exact', head=True).eq('room_id', room_id).execute()
            active = locs.count or 0
            stats['charts']['roomsUtilization'].append({'name': room_name, 'activePets': active})
        
        result = supabase.table('staff').select('id').execute()
        staff_data = []
        for s in result.data:
            staff_id = s.get('id')
            user_result = supabase.table('users').select('name').eq('id', staff_id).execute()
            staff_name = user_result.data[0].get('name', f"Staff #{staff_id}") if user_result.data else f"Staff #{staff_id}"
            count = supabase.table('appointments').select('id', count='exact', head=True).eq('staff_id', staff_id).execute()
            total = count.count or 0
            count = supabase.table('appointments').select('id', count='exact', head=True).eq('staff_id', staff_id).eq('status', 'COMPLETED').execute()
            completed = count.count or 0
            staff_data.append({'name': staff_name, 'totalAppointments': total, 'completedAppointments': completed})
        stats['charts']['staffPerformance'] = staff_data
        
        return JsonResponse(stats)

@method_decorator(csrf_exempt, name='dispatch')
class FiltersView(View):
    def get(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        result = supabase.table('filter_categories').select('*, filter_options(*)').execute()
        return JsonResponse({'filters': result.data})
    
    def post(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        
        action = data.get('action', '')
        
        # Handle creating filter option
        if action == 'create_option':
            category_id = data.get('category_id')
            if not category_id:
                return JsonResponse({'error': 'Category ID required'}, status=400)
            try:
                opt = supabase.table('filter_options').insert({
                    'category_id': int(category_id),
                    'label': data.get('label', ''),
                    'value': data.get('value', ''),
                    'sort_order': data.get('sort_order', 0),
                    'is_active': True
                }).execute()
                return JsonResponse({'option': opt.data[0]}, status=201)
            except Exception as e:
                return JsonResponse({'error': str(e)}, status=400)
        
        # Handle creating filter option - alternate format
        if action == 'create_category':
            cat_result = supabase.table('filter_categories').insert({
                'key': data.get('key'), 
                'label': data.get('label'), 
                'description': data.get('description'),
                'is_active': True
            }).execute()
            return JsonResponse({'filter': cat_result.data[0]}, status=201)
        
        # Remove action from data before inserting
        data.pop('action', None)
        
        # Check if we're adding options to existing category
        if 'options' in data and data['options']:
            options_to_insert = []
            for opt in data['options']:
                if opt.get('category_id'):
                    options_to_insert.append({
                        'category_id': opt['category_id'],
                        'label': opt.get('label', ''),
                        'value': opt.get('value', ''),
                        'sort_order': opt.get('sort_order', 0),
                        'is_active': True
                    })
            if options_to_insert:
                try:
                    supabase.table('filter_options').insert(options_to_insert).execute()
                    return JsonResponse({'success': True, 'message': 'Options added'}, status=201)
                except Exception as e:
                    return JsonResponse({'error': str(e)}, status=400)
        
        # Creating new category with options
        if 'options' in data:
            options_copy = [dict(opt) for opt in data['options']]
            cat_result = supabase.table('filter_categories').insert({
                'key': data.get('key'), 
                'label': data.get('label'), 
                'description': data.get('description'),
                'is_active': True
            }).execute()
            if cat_result.data:
                new_cat_id = cat_result.data[0]['id']
                for opt in options_copy:
                    opt['category_id'] = new_cat_id
                supabase.table('filter_options').insert(options_copy).execute()
            return JsonResponse({'filter': cat_result.data[0]}, status=201)
        
        result = supabase.table('filter_categories').insert(data).execute()
        return JsonResponse({'filter': result.data[0]}, status=201)
    
    def patch(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        data = json_body(request)
        
        if 'type' in data:
            if data['type'] == 'category':
                cat_id = data.get('id')
                if not cat_id:
                    return JsonResponse({'error': 'Category ID required'}, status=400)
                update_data = {}
                if 'label' in data:
                    update_data['label'] = data['label']
                if 'description' in data:
                    update_data['description'] = data['description']
                if 'is_active' in data:
                    update_data['is_active'] = data['is_active']
                result = supabase.table('filter_categories').update(update_data).eq('id', int(cat_id)).execute()
                return JsonResponse({'category': result.data[0]})
            elif data['type'] == 'option':
                opt_id = data.get('id')
                if not opt_id:
                    return JsonResponse({'error': 'Option ID required'}, status=400)
                update_data = {}
                if 'label' in data:
                    update_data['label'] = data['label']
                if 'value' in data:
                    update_data['value'] = data['value']
                if 'sort_order' in data:
                    update_data['sort_order'] = data['sort_order']
                if 'is_active' in data:
                    update_data['is_active'] = data['is_active']
                result = supabase.table('filter_options').update(update_data).eq('id', int(opt_id)).execute()
                return JsonResponse({'option': result.data[0]})
        
        return JsonResponse({'error': 'Invalid request'}, status=400)
    
    def delete(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        supabase = get_supabase()
        record_id = request.GET.get('id')
        record_type = request.GET.get('type')
        
        if not record_id:
            return JsonResponse({'error': 'ID required'}, status=400)
        
        try:
            if record_type == 'category':
                supabase.table('filter_categories').delete().eq('id', int(record_id)).execute()
            elif record_type == 'option':
                supabase.table('filter_options').delete().eq('id', int(record_id)).execute()
            else:
                return JsonResponse({'error': 'Invalid type'}, status=400)
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@method_decorator(csrf_exempt, name='dispatch')
class TokenAuthView(View):
    """
    Token-based auth for mobile apps.
    Mobile sends user_id and role in headers instead of cookies.
    """
    def post(self, request):
        try:
            supabase = get_supabase()
            data = json_body(request)
            
            user_id = data.get('user_id')
            user_role = data.get('role')
            
            if not user_id or not user_role:
                return JsonResponse({'error': 'Invalid token'}, status=401)
            
            result = supabase.table('users').select('id, email, name, role, is_active, created_at').eq('id', int(user_id)).execute()
            
            if not result.data or not result.data[0].get('is_active'):
                return JsonResponse({'error': 'Invalid or inactive user'}, status=401)
            
            user = result.data[0]
            return JsonResponse({
                'user': user,
                'message': 'Token valid',
                'authenticated': True
            }, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=401)
    
    def get(self, request):
        user_id = request.headers.get('X-User-ID')
        user_role = request.headers.get('X-User-Role')
        
        if not user_id or not user_role:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        
        try:
            supabase = get_supabase()
            result = supabase.table('users').select('id, email, name, role, is_active, created_at').eq('id', int(user_id)).execute()
            
            if not result.data or not result.data[0].get('is_active'):
                return JsonResponse({'error': 'Invalid or inactive user'}, status=401)
            
            return JsonResponse({'user': result.data[0]}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=401)


@method_decorator(csrf_exempt, name='dispatch')
class FCMTokenView(View):
    def post(self, request):
        user_id, _ = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        supabase = get_supabase()
        data = json_body(request)
        token = data.get('token')

        if not token:
            return JsonResponse({'error': 'Token required'}, status=400)

        supabase.table('users').update({'fcm_token': token}).eq('id', int(user_id)).execute()
        return JsonResponse({'success': True})


@method_decorator(csrf_exempt, name='dispatch')
class CheckRemindersView(View):
    def post(self, request):
        user_id, user_role = get_user_from_cookies(request)
        if not user_id:
            return JsonResponse({'error': 'Unauthorized'}, status=401)

        supabase = get_supabase()
        today = datetime.now().date()
        now = datetime.now()
        current_time = now.strftime('%H:%M')
        created = []

        query = supabase.table('prescriptions').select('*, pets!inner(name, species, owner_id), pet_owners!inner(user_id)').gte('scheduled_end', today.isoformat()).lte('scheduled_start', today.isoformat())

        if user_role == 'PET_OWNER':
            owner_result = supabase.table('pet_owners').select('id').eq('user_id', int(user_id)).execute()
            if not owner_result.data:
                return JsonResponse({'reminders': []})
            query = supabase.table('prescriptions').select('*, pets(name, species)').gte('scheduled_end', today.isoformat()).lte('scheduled_start', today.isoformat())
            pet_result = supabase.table('pets').select('id').eq('owner_id', owner_result.data[0]['id']).execute()
            if not pet_result.data:
                return JsonResponse({'reminders': []})
            query = query.in_('pet_id', [p['id'] for p in pet_result.data])

        result = query.execute()
        if not result.data:
            return JsonResponse({'reminders': []})

        for rx in result.data:
            scheduled_times = (rx.get('scheduled_times') or '').strip()
            if not scheduled_times:
                continue

            last_reminded = rx.get('last_reminded_at')
            if last_reminded:
                try:
                    last_date = datetime.fromisoformat(last_reminded.replace('Z', '+00:00')).date()
                    if last_date == today:
                        continue
                except (ValueError, TypeError):
                    pass

            medication_name = rx.get('medication_name', 'Medication')
            pet_name = rx.get('pets', {}).get('name', f"Pet #{rx.get('pet_id')}")
            dosage_info = rx.get('dosage_per_time') or rx.get('dosage') or ''

            for time_slot in scheduled_times.split(','):
                time_slot = time_slot.strip()
                if not time_slot:
                    continue

                message = f"Time to give {medication_name} to {pet_name}"
                if dosage_info:
                    message += f" - {dosage_info}"

                create_notification(supabase, int(user_id), message, 'PRESCRIPTION')
                created.append({'medication_name': medication_name, 'time': time_slot, 'message': message})

            supabase.table('prescriptions').update({'last_reminded_at': now.isoformat()}).eq('id', rx['id']).execute()

        return JsonResponse({'reminders': created, 'count': len(created)})
