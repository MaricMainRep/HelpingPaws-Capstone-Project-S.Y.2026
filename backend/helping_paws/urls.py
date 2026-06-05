from django.contrib import admin
from django.urls import path, include
from api.views import (
    LoginView, LogoutView, RegisterView, MeView, UsersView, PetsView,
    AppointmentsView, HealthRecordsView, PrescriptionsView, VaccinationsView,
    StaffView, StaffAvailabilityView, CamerasView, NotificationsView,
    RoomsView, PetLocationsView, ActivityLogsView, DashboardStatsView,
    AnalyticsView, FiltersView, TokenAuthView, CheckRemindersView
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/', LoginView.as_view(), name='login'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/me/', MeView.as_view(), name='me'),
    path('api/users/', UsersView.as_view(), name='users'),
    path('api/pets/', PetsView.as_view(), name='pets'),
    path('api/appointments/', AppointmentsView.as_view(), name='appointments'),
    path('api/health-records/', HealthRecordsView.as_view(), name='health-records'),
    path('api/prescriptions/', PrescriptionsView.as_view(), name='prescriptions'),
    path('api/vaccinations/', VaccinationsView.as_view(), name='vaccinations'),
    path('api/staff/', StaffView.as_view(), name='staff'),
    path('api/staff/availability/', StaffAvailabilityView.as_view(), name='staff-availability'),
    path('api/cameras/', CamerasView.as_view(), name='cameras'),
    path('api/notifications/', NotificationsView.as_view(), name='notifications'),
    path('api/rooms/', RoomsView.as_view(), name='rooms'),
    path('api/pet-locations/', PetLocationsView.as_view(), name='pet-locations'),
    path('api/activity-logs/', ActivityLogsView.as_view(), name='activity-logs'),
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('api/analytics/', AnalyticsView.as_view(), name='analytics'),
    path('api/filters/', FiltersView.as_view(), name='filters'),
    path('api/auth/token/', TokenAuthView.as_view(), name='token-auth'),
    path('api/check-reminders/', CheckRemindersView.as_view(), name='check-reminders'),
]