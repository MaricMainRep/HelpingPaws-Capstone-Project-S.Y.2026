import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const password = 'password123';
const hashedPassword = await bcrypt.hash(password, 10);

async function seed() {
  try {
    console.log('Starting database seed...');

    // Create users
    const adminUser = {
      email: 'admin@helpingpaws.com',
      password_hash: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      is_active: true,
    };

    const staffUsers = [
      {
        email: 'dr.smith@helpingpaws.com',
        password_hash: hashedPassword,
        name: 'Dr. Sarah Smith',
        role: 'STAFF',
        is_active: true,
      },
      {
        email: 'dr.jones@helpingpaws.com',
        password_hash: hashedPassword,
        name: 'Dr. Michael Jones',
        role: 'STAFF',
        is_active: true,
      },
      {
        email: 'nurse.emily@helpingpaws.com',
        password_hash: hashedPassword,
        name: 'Emily Rodriguez',
        role: 'STAFF',
        is_active: true,
      },
    ];

    const ownerUsers = [
      {
        email: 'john.doe@email.com',
        password_hash: hashedPassword,
        name: 'John Doe',
        role: 'PET_OWNER',
        is_active: true,
      },
      {
        email: 'jane.smith@email.com',
        password_hash: hashedPassword,
        name: 'Jane Smith',
        role: 'PET_OWNER',
        is_active: true,
      },
      {
        email: 'bob.wilson@email.com',
        password_hash: hashedPassword,
        name: 'Bob Wilson',
        role: 'PET_OWNER',
        is_active: true,
      },
      {
        email: 'alice.brown@email.com',
        password_hash: hashedPassword,
        name: 'Alice Brown',
        role: 'PET_OWNER',
        is_active: true,
      },
    ];

    // Insert users
    console.log('Creating users...');
    const { data: adminData, error: adminError } = await supabase
      .from('users')
      .insert([adminUser])
      .select();

    if (adminError) throw adminError;
    const adminId = adminData[0].id;
    console.log(`✓ Created admin user: ${adminUser.name} (ID: ${adminId})`);

    const { data: staffData, error: staffError } = await supabase
      .from('users')
      .insert(staffUsers)
      .select();

    if (staffError) throw staffError;
    console.log(`✓ Created ${staffData.length} staff users`);

    const { data: ownerData, error: ownerError } = await supabase
      .from('users')
      .insert(ownerUsers)
      .select();

    if (ownerError) throw ownerError;
    console.log(`✓ Created ${ownerData.length} pet owner users`);

    // Create staff records
    console.log('Creating staff records...');
    const staffRecords = staffData.map((user, index) => ({
      user_id: user.id,
      specialty: index === 0 ? 'General Surgery' : index === 1 ? 'Orthopedics' : 'Nursing',
      phone: `555-${1000 + index}`,
      schedule_notes: `Available ${index === 0 ? 'Mon-Fri' : 'Tue-Sat'}`,
      is_available: true,
    }));

    const { data: staffRecordsData, error: staffRecordsError } = await supabase
      .from('staff')
      .insert(staffRecords)
      .select();

    if (staffRecordsError) throw staffRecordsError;
    console.log(`✓ Created ${staffRecordsData.length} staff records`);

    // Create pet owner records
    console.log('Creating pet owner records...');
    const petOwnerRecords = ownerData.map((user, index) => ({
      user_id: user.id,
      phone: `555-${2000 + index}`,
      address: `${100 + index} Main St, Pet City, PC 12345`,
    }));

    const { data: petOwnerData, error: petOwnerError } = await supabase
      .from('pet_owners')
      .insert(petOwnerRecords)
      .select();

    if (petOwnerError) throw petOwnerError;
    console.log(`✓ Created ${petOwnerData.length} pet owner records`);

    // Create pets
    console.log('Creating pets...');
    const pets = [
      {
        owner_id: petOwnerData[0].id,
        name: 'Max',
        species: 'Dog',
        breed: 'Golden Retriever',
        age: 3.5,
        weight: 65,
        medical_history_notes: 'Routine checkups only',
      },
      {
        owner_id: petOwnerData[0].id,
        name: 'Whiskers',
        species: 'Cat',
        breed: 'Persian',
        age: 2,
        weight: 12,
        medical_history_notes: 'Allergic to chicken',
      },
      {
        owner_id: petOwnerData[1].id,
        name: 'Bella',
        species: 'Dog',
        breed: 'Labrador',
        age: 5,
        weight: 70,
        medical_history_notes: 'Mild arthritis, on glucosamine',
      },
      {
        owner_id: petOwnerData[1].id,
        name: 'Mittens',
        species: 'Cat',
        breed: 'Siamese',
        age: 4,
        weight: 10,
        medical_history_notes: 'Diabetes - insulin daily',
      },
      {
        owner_id: petOwnerData[2].id,
        name: 'Charlie',
        species: 'Dog',
        breed: 'Beagle',
        age: 2,
        weight: 30,
        medical_history_notes: 'Prone to ear infections',
      },
      {
        owner_id: petOwnerData[3].id,
        name: 'Luna',
        species: 'Dog',
        breed: 'Husky',
        age: 1.5,
        weight: 55,
        medical_history_notes: 'Young and healthy',
      },
    ];

    const { data: petsData, error: petsError } = await supabase
      .from('pets')
      .insert(pets)
      .select();

    if (petsError) throw petsError;
    console.log(`✓ Created ${petsData.length} pets`);

    // Create appointments
    console.log('Creating appointments...');
    const now = new Date();
    const appointments = [
      {
        pet_id: petsData[0].id,
        staff_id: staffRecordsData[0].id,
        owner_id: petOwnerData[0].id,
        appointment_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'CONFIRMED',
        notes: 'Routine checkup and vaccination',
      },
      {
        pet_id: petsData[1].id,
        staff_id: staffRecordsData[1].id,
        owner_id: petOwnerData[0].id,
        appointment_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING',
        notes: 'Dental cleaning',
      },
      {
        pet_id: petsData[2].id,
        staff_id: staffRecordsData[0].id,
        owner_id: petOwnerData[1].id,
        appointment_date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'CONFIRMED',
        notes: 'Follow-up for arthritis',
      },
      {
        pet_id: petsData[4].id,
        staff_id: staffRecordsData[2].id,
        owner_id: petOwnerData[2].id,
        appointment_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'CONFIRMED',
        notes: 'Ear infection treatment',
      },
      {
        pet_id: petsData[5].id,
        staff_id: staffRecordsData[0].id,
        owner_id: petOwnerData[3].id,
        appointment_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'PENDING',
        notes: 'First vaccination series',
      },
    ];

    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('appointments')
      .insert(appointments)
      .select();

    if (appointmentsError) throw appointmentsError;
    console.log(`✓ Created ${appointmentsData.length} appointments`);

    // Create health records
    console.log('Creating health records...');
    const healthRecords = [
      {
        pet_id: petsData[0].id,
        diagnosis: 'Healthy with minor dental tartar',
        treatment: 'Prophylactic dental cleaning recommended',
        recorded_by_staff_id: staffRecordsData[0].id,
      },
      {
        pet_id: petsData[1].id,
        diagnosis: 'Mild food allergy',
        treatment: 'Switched to hypoallergenic diet',
        recorded_by_staff_id: staffRecordsData[1].id,
      },
      {
        pet_id: petsData[2].id,
        diagnosis: 'Osteoarthritis in rear legs',
        treatment: 'Glucosamine supplement and weight management',
        recorded_by_staff_id: staffRecordsData[0].id,
      },
      {
        pet_id: petsData[3].id,
        diagnosis: 'Type 1 Diabetes',
        treatment: 'Daily insulin injections, dietary management',
        recorded_by_staff_id: staffRecordsData[1].id,
      },
      {
        pet_id: petsData[4].id,
        diagnosis: 'Chronic otitis externa',
        treatment: 'Antibiotic ear drops, weekly cleaning',
        recorded_by_staff_id: staffRecordsData[2].id,
      },
    ];

    const { data: healthRecordsData, error: healthRecordsError } = await supabase
      .from('health_records')
      .insert(healthRecords)
      .select();

    if (healthRecordsError) throw healthRecordsError;
    console.log(`✓ Created ${healthRecordsData.length} health records`);

    // Create prescriptions
    console.log('Creating prescriptions...');
    const prescriptions = [
      {
        health_record_id: healthRecordsData[1].id,
        pet_id: petsData[1].id,
        medication_name: 'Hypoallergenic Dog Food',
        dosage: 'As needed',
        duration: 'Ongoing',
        notes: 'Royal Canin Hydrolyzed Protein',
      },
      {
        health_record_id: healthRecordsData[2].id,
        pet_id: petsData[2].id,
        medication_name: 'Glucosamine Supplement',
        dosage: '500mg twice daily',
        duration: '6 months',
        notes: 'With chondroitin',
      },
      {
        health_record_id: healthRecordsData[3].id,
        pet_id: petsData[3].id,
        medication_name: 'Insulin Glargine',
        dosage: '4 units twice daily',
        duration: 'Ongoing',
        notes: 'Monitor blood glucose regularly',
      },
      {
        health_record_id: healthRecordsData[4].id,
        pet_id: petsData[4].id,
        medication_name: 'Enrofloxacin Ear Drops',
        dosage: '5 drops twice daily',
        duration: '14 days',
        notes: 'Clean ear before application',
      },
    ];

    const { data: prescriptionsData, error: prescriptionsError } = await supabase
      .from('prescriptions')
      .insert(prescriptions)
      .select();

    if (prescriptionsError) throw prescriptionsError;
    console.log(`✓ Created ${prescriptionsData.length} prescriptions`);

    // Create vaccinations
    console.log('Creating vaccinations...');
    const vaccinations = [
      {
        pet_id: petsData[0].id,
        vaccine_name: 'DHPP (Distemper, Hepatitis, Parvo, Parainfluenza)',
        administered_date: '2024-01-15',
        next_due_date: '2025-01-15',
        notes: 'Booster shot',
      },
      {
        pet_id: petsData[0].id,
        vaccine_name: 'Rabies',
        administered_date: '2024-01-15',
        next_due_date: '2026-01-15',
        notes: '3-year vaccine',
      },
      {
        pet_id: petsData[1].id,
        vaccine_name: 'FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)',
        administered_date: '2024-02-10',
        next_due_date: '2025-02-10',
        notes: 'Annual booster',
      },
      {
        pet_id: petsData[1].id,
        vaccine_name: 'Rabies (Feline)',
        administered_date: '2024-02-10',
        next_due_date: '2026-02-10',
        notes: '3-year vaccine',
      },
      {
        pet_id: petsData[2].id,
        vaccine_name: 'DHPP (Distemper, Hepatitis, Parvo, Parainfluenza)',
        administered_date: '2023-12-20',
        next_due_date: '2024-12-20',
        notes: 'Booster shot',
      },
      {
        pet_id: petsData[4].id,
        vaccine_name: 'DHPP (Distemper, Hepatitis, Parvo, Parainfluenza)',
        administered_date: '2024-02-01',
        next_due_date: '2024-03-01',
        notes: 'First shot of series',
      },
      {
        pet_id: petsData[5].id,
        vaccine_name: 'DHPP (Distemper, Hepatitis, Parvo, Parainfluenza)',
        administered_date: '2024-03-15',
        next_due_date: '2024-04-15',
        notes: 'Puppy first shot',
      },
    ];

    const { data: vaccinationsData, error: vaccinationsError } = await supabase
      .from('vaccinations')
      .insert(vaccinations)
      .select();

    if (vaccinationsError) throw vaccinationsError;
    console.log(`✓ Created ${vaccinationsData.length} vaccinations`);

    // Create cameras (must be created before pet_locations for FK)
    console.log('Creating cameras...');
    const cameras = [
      {
        room_number: 'Room 101',
        stream_url: 'rtsp://localhost:8554/room101',
        is_active: true,
      },
      {
        room_number: 'Room 102',
        stream_url: 'rtsp://localhost:8554/room102',
        is_active: true,
      },
      {
        room_number: 'Room 103',
        stream_url: 'rtsp://localhost:8554/room103',
        is_active: true,
      },
      {
        room_number: 'Recovery',
        stream_url: 'rtsp://localhost:8554/recovery',
        is_active: true,
      },
    ];

    const { data: camerasData, error: camerasError } = await supabase
      .from('cameras')
      .insert(cameras)
      .select();

    if (camerasError) throw camerasError;
    console.log(`✓ Created ${camerasData.length} cameras`);

    // Create pet locations
    console.log('Creating pet locations...');
    const petLocations = [
      {
        pet_id: petsData[0].id,
        room_number: 'Room 101',
        cage_number: 'Cage A',
        status: 'CHECKED_IN',
      },
      {
        pet_id: petsData[1].id,
        room_number: 'Room 102',
        cage_number: 'Cage B',
        status: 'UNDER_OBSERVATION',
      },
      {
        pet_id: petsData[2].id,
        room_number: 'Room 101',
        cage_number: 'Cage C',
        status: 'READY_FOR_PICKUP',
      },
    ];

    const { data: petLocationsData, error: petLocationsError } = await supabase
      .from('pet_locations')
      .insert(petLocations)
      .select();

    if (petLocationsError) throw petLocationsError;
    console.log(`✓ Created ${petLocationsData.length} pet locations`);

    // Create staff availability
    console.log('Creating staff availability...');
    const staffAvailability = [];
    for (let i = 0; i < staffRecordsData.length; i++) {
      for (let day = 0; day < 6; day++) {
        staffAvailability.push({
          staff_id: staffRecordsData[i].id,
          day_of_week: day,
          start_time: '09:00',
          end_time: '17:00',
        });
      }
    }

    const { data: availabilityData, error: availabilityError } = await supabase
      .from('staff_availability')
      .insert(staffAvailability)
      .select();

    if (availabilityError) throw availabilityError;
    console.log(`✓ Created ${availabilityData.length} staff availability records`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nTest Credentials:');
    console.log('Admin:      admin@helpingpaws.com / password123');
    console.log('Staff:      dr.smith@helpingpaws.com / password123');
    console.log('Pet Owner:  john.doe@email.com / password123');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
