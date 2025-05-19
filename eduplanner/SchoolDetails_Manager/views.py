from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
import logging
from .models import Teacher, Section, Subject, Advisory, TimeSlot, Schedule

# Configure logger
logger = logging.getLogger(__name__)

# Helper class to avoid duplicate code
class SchoolHelper:
    @staticmethod
    def get_current_school_year():
        # Default value for current school year
        return "2023-2024"

def index(request):
    # Current school year only needed for display purposes
    current_year = SchoolHelper.get_current_school_year()
    context = {
        'current_school_year': current_year
    }
    return render(request, 'index.html', context)

# Protected views
@login_required(login_url='login')
def dashboard(request):
    current_year = SchoolHelper.get_current_school_year()
    context = {
        'current_school_year': current_year,
        'user': request.user  # Pass the user to the template
    }
    return render(request, 'dashboard.html', context)

@login_required(login_url='login')
def school_scheduling_details(request):
    current_year = SchoolHelper.get_current_school_year()
    context = {
        'current_school_year': current_year,
        'user': request.user
    }
    return render(request, 'schoolSchedulingDetails.html', context)

def class_programs(request):
    current_year = SchoolHelper.get_current_school_year()
    context = {
        'current_school_year': current_year
    }
    return render(request, 'class-programs.html', context)

def create_timetable(request):
    current_year = SchoolHelper.get_current_school_year()
    
    # Get all required data for timetable creation
    sections = Section.objects.all().order_by('grade_level', 'name')
    teachers = Teacher.objects.all().order_by('name')
    subjects = Subject.objects.all().order_by('name')
    time_slots = TimeSlot.objects.all().order_by('day', 'start_time')
    
    # Get days of the week from time slots to show in the UI
    days = sorted(set([ts.day for ts in time_slots]))
    if not days:
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    
    context = {
        'current_school_year': current_year,
        'sections': sections,
        'teachers': teachers,
        'subjects': subjects,
        'time_slots': time_slots,
        'days': days
    }
    
    return render(request, 'create-timetable.html', context)

def login_page(request):
    return render(request, 'log-in.html')

def sign_in(request):
    return render(request, 'sign-in-eduplanner.html')

def forgot_password(request):
    return render(request, 'forgotpass.html')

def about_page(request):
    return render(request, 'aboutpage.html')

def contact_page(request):
    return render(request, 'contact.html')

def profile_settings(request):
    user = request.user
    context = {
        'user': user,
    }
    return render(request, 'profile_settings.html', context)

def forgotpass(request):
    return render(request, 'forgotpass.html')


@csrf_exempt
def get_current_school_year(request):
    return JsonResponse({'year_range': SchoolHelper.get_current_school_year()})

@csrf_exempt
def get_teachers(request): #read teachers
    # No school_year filter needed as Teacher model is year-independent
    teachers = Teacher.objects.all()
    data = []
    for teacher in teachers:
        data.append({
            'id': teacher.id,
            'name': teacher.name,
            'specialization': teacher.specialization,
            'teaching_load': teacher.teaching_load
        })
    return JsonResponse(data, safe=False)

@csrf_exempt
def save_teacher(request): #create or update teacher
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            teacher, created = Teacher.objects.update_or_create(
                id=data.get('id'),
                defaults={
                    'name': data.get('name'),
                    'specialization': data.get('specialization'),
                    'teaching_load': data.get('teaching_load', 6)
                }
            )
            
            return JsonResponse({'success': True, 'created': created})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False})

@csrf_exempt
def delete_teacher(request, teacher_id): #delete teacher by id
    if request.method == 'POST':
        try:
            # Teacher deletion is not tied to any school year
            teacher = Teacher.objects.get(id=teacher_id)
            teacher.delete()
            return JsonResponse({'success': True})
        except Teacher.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Teacher not found'})
    return JsonResponse({'success': False})

@csrf_exempt
def save_school_year(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            year_range = data.get('year_range')
            return JsonResponse({'success': True, 'year_range': year_range})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False})

# Section Endpoints
@csrf_exempt
def get_sections(request): #read sections
    # No school_year filter needed as Section model is year-independent
    sections = Section.objects.all()
    
    # Simple serialization of section data without adviser information
    result = []
    for section in sections:
        section_data = {
            'id': section.id,
            'name': section.name,
            'gradeLevel': section.grade_level
        }
        result.append(section_data)
    
    return JsonResponse(result, safe=False)

@csrf_exempt
def save_section(request): #create or update sections
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Create or update the section (without adviser)
            section, created = Section.objects.update_or_create(
                id=data.get('id'),
                defaults={
                    'name': data.get('name'),
                    'grade_level': data.get('gradeLevel')
                }
            )
            
            return JsonResponse({'success': True, 'created': created})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False})

@csrf_exempt
def delete_section(request, section_id): # delete section by id
    if request.method == 'POST':
        try:
            # Section deletion is not tied to any school year
            section = Section.objects.get(id=section_id)
            section.delete()
            return JsonResponse({'success': True})
        except Section.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Section not found'})
    return JsonResponse({'success': False})

# Subject Endpoints
@csrf_exempt
def get_subjects(request): #read subjects
    # No school_year filter needed as Subject model is year-independent
    subjects = Subject.objects.all()
    # Convert field names to match JavaScript convention
    result = []
    for subject in subjects:
        result.append({
            'id': subject.id,
            'name': subject.name,
        })
    return JsonResponse(result, safe=False)
    
@csrf_exempt
def save_subject(request): #create or update subjects
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            subject, created = Subject.objects.update_or_create(
                id=data.get('id'),
                defaults={
                    'name': data.get('name'),
                }
            )
            
            return JsonResponse({'success': True, 'created': created})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False})

@csrf_exempt
def delete_subject(request, subject_id): #delete subject by id
    if request.method == 'POST':
        try:
            # Subject deletion is not tied to any school year
            subject = Subject.objects.get(id=subject_id)
            subject.delete()
            return JsonResponse({'success': True})
        except Subject.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Subject not found'})
    return JsonResponse({'success': False})


# Schedule Management Endpoints
@csrf_exempt
def get_schedule(request):
    school_year_range = request.GET.get('year', None)
    section_id = request.GET.get('section', None)
    
    # If no school year specified, use the current school year
    if not school_year_range:
        school_year_range = SchoolHelper.get_current_school_year()
    
    # Build the base query
    query = Schedule.objects.filter(school_year=school_year_range)
    
    # Apply section filter if provided
    if section_id:
        try:
            section = Section.objects.get(id=section_id)
            query = query.filter(section=section)
        except Section.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Section not found'}, status=404)
    
    # Get all schedule entries with related data
    schedules = query.select_related('time_slot', 'section', 'subject', 'teacher')
    
    result = []
    for schedule in schedules:
        result.append({
            'id': schedule.id,
            'timeSlotId': schedule.time_slot.id,
            'day': schedule.time_slot.day,
            'startTime': schedule.time_slot.start_time.strftime('%H:%M'),
            'endTime': schedule.time_slot.end_time.strftime('%H:%M'),
            'sectionId': schedule.section.id,
            'sectionName': schedule.section.name,
            'gradeLevel': schedule.section.grade_level,
            'subjectId': schedule.subject.id,
            'subjectName': schedule.subject.name,
            'teacherId': schedule.teacher.id,
            'teacherName': schedule.teacher.name,
            'schoolYear': schedule.school_year
        })
    
    return JsonResponse(result, safe=False)

@csrf_exempt
def save_schedule(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # Get required related objects
            try:
                time_slot_id = data.get('timeSlotId')
                section_id = data.get('sectionId')
                subject_id = data.get('subjectId')
                teacher_id = data.get('teacherId')
                
                # Validate required fields
                if not all([time_slot_id, section_id, subject_id, teacher_id]):
                    return JsonResponse({
                        'success': False, 
                        'error': 'Missing required fields. Please provide timeSlotId, sectionId, subjectId, and teacherId.'
                    })
                
                time_slot = TimeSlot.objects.get(id=time_slot_id)
                section = Section.objects.get(id=section_id)
                subject = Subject.objects.get(id=subject_id)
                teacher = Teacher.objects.get(id=teacher_id)
                
                # Get school year
                school_year_range = data.get('schoolYear')
                if not school_year_range:
                    school_year_range = SchoolHelper.get_current_school_year()
                
            except (TimeSlot.DoesNotExist, Section.DoesNotExist, Subject.DoesNotExist, Teacher.DoesNotExist) as e:
                return JsonResponse({
                    'success': False, 
                    'error': f'Related object not found: {str(e)}'
                })
            
            # Generate a unique ID if not provided
            schedule_id = data.get('id')
            if not schedule_id:
                schedule_id = f"{section.id}_{school_year_range}"
            
            # Check for scheduling conflicts (same section, same timeslot, same school year)
            existing_schedule = Schedule.objects.filter(
                time_slot=time_slot,
                section=section,
                school_year=school_year_range
            ).exclude(id=schedule_id).first()
            
            if existing_schedule:
                return JsonResponse({
                    'success': False, 
                    'error': f'Scheduling conflict: Section {section.name} already has {existing_schedule.subject.name} with {existing_schedule.teacher.name} during this time slot.'
                })
            
            # Check for teacher conflicts (same teacher, same timeslot, same school year)
            teacher_conflict = Schedule.objects.filter(
                time_slot=time_slot,
                teacher=teacher,
                school_year=school_year_range
            ).exclude(id=schedule_id).first()
            
            if teacher_conflict:
                return JsonResponse({
                    'success': False, 
                    'error': f'Teacher conflict: {teacher.name} is already teaching {teacher_conflict.subject.name} to {teacher_conflict.section.name} during this time slot.'
                })
            
            # Create or update the schedule
            schedule, created = Schedule.objects.update_or_create(
                id=schedule_id,
                defaults={
                    'time_slot': time_slot,
                    'section': section,
                    'subject': subject,
                    'teacher': teacher,
                    'school_year': school_year_range
                }
            )
            return JsonResponse({
                'success': True, 
                'created': created,
                'id': schedule.id,
                'sectionName': section.name,
                'subjectName': subject.name,
                'teacherName': teacher.name,
                'day': time_slot.day,
                'startTime': time_slot.start_time.strftime('%H:%M'),
                'endTime': time_slot.end_time.strftime('%H:%M'),
                'schoolYear': school_year_range  # Include school year in response
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@csrf_exempt
def delete_schedule(request, schedule_id):
    if request.method == 'POST':
        try:
            schedule = Schedule.objects.get(id=schedule_id)
            schedule.delete()
            return JsonResponse({'success': True})
        except Schedule.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Schedule not found'})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@csrf_exempt
def get_teacher_schedule(request, teacher_id):
    school_year_range = request.GET.get('year', None)
    
    # If no school year specified, use the current school year
    if not school_year_range:
        school_year_range = SchoolHelper.get_current_school_year()
    
    try:
        teacher = Teacher.objects.get(id=teacher_id)
    except Teacher.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Teacher not found'}, status=404)
    
    # Get all schedule entries for this teacher
    schedules = Schedule.objects.filter(
        teacher=teacher,
        school_year=school_year_range
    ).select_related('time_slot', 'section', 'subject')
    
    result = []
    for schedule in schedules:
        result.append({
            'id': schedule.id,
            'timeSlotId': schedule.time_slot.id,
            'day': schedule.time_slot.day,
            'startTime': schedule.time_slot.start_time.strftime('%H:%M'),
            'endTime': schedule.time_slot.end_time.strftime('%H:%M'),
            'sectionId': schedule.section.id,
            'sectionName': schedule.section.name,
            'subjectId': schedule.subject.id,
            'subjectName': schedule.subject.name,
            'schoolYear': schedule.school_year
        })
    
    return JsonResponse(result, safe=False)

@csrf_exempt
def get_section_schedule(request, section_id):
    school_year_range = request.GET.get('year', None)
    
    # If no school year specified, use the current school year
    if not school_year_range:
        school_year_range = SchoolHelper.get_current_school_year()
    
    try:
        section = Section.objects.get(id=section_id)
    except Section.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Section not found'}, status=404)
    
    # Get all schedule entries for this section
    schedules = Schedule.objects.filter(
        section=section,
        school_year=school_year_range
    ).select_related('time_slot', 'teacher', 'subject')
    
    result = []
    for schedule in schedules:
        result.append({
            'id': schedule.id,
            'timeSlotId': schedule.time_slot.id,
            'day': schedule.time_slot.day,
            'startTime': schedule.time_slot.start_time.strftime('%H:%M'),
            'endTime': schedule.time_slot.end_time.strftime('%H:%M'),
            'teacherId': schedule.teacher.id,
            'teacherName': schedule.teacher.name,
            'subjectId': schedule.subject.id,
            'subjectName': schedule.subject.name,
            'schoolYear': schedule.school_year
        })
    
    return JsonResponse(result, safe=False)

@csrf_exempt
def check_conflicts(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            time_slot_id = data.get('timeSlotId')
            section_id = data.get('sectionId')
            teacher_id = data.get('teacherId')
            school_year_range = data.get('schoolYear', SchoolHelper.get_current_school_year())
            
            # Skip conflict check if any required field is missing
            if not all([time_slot_id, section_id, teacher_id]):
                return JsonResponse({'success': True, 'conflicts': []})
            
            try:
                time_slot = TimeSlot.objects.get(id=time_slot_id)
                section = Section.objects.get(id=section_id)
                teacher = Teacher.objects.get(id=teacher_id)
            except (TimeSlot.DoesNotExist, Section.DoesNotExist, Teacher.DoesNotExist):
                return JsonResponse({'success': False, 'error': 'One or more related objects not found'})
            
            conflicts = []
            
            # Check for section conflict (section already scheduled at this time)
            section_conflict = Schedule.objects.filter(
                time_slot=time_slot,
                section=section,
                school_year=school_year_range
            ).select_related('subject', 'teacher').first()
            
            if section_conflict:
                conflicts.append({
                    'type': 'section',
                    'message': f'Section {section.name} already has {section_conflict.subject.name} with {section_conflict.teacher.name} during this time slot.'
                })
            
            # Check for teacher conflict (teacher already teaching elsewhere at this time)
            teacher_conflict = Schedule.objects.filter(
                time_slot=time_slot,
                teacher=teacher,
                school_year=school_year_range
            ).select_related('section', 'subject').first()
            
            if teacher_conflict:
                conflicts.append({
                    'type': 'teacher',
                    'message': f'Teacher {teacher.name} is already teaching {teacher_conflict.subject.name} to {teacher_conflict.section.name} during this time slot.'
                })

            #conflict check pa here 
            
            return JsonResponse({
                'success': True,
                'conflicts': conflicts,
                'hasConflicts': len(conflicts) > 0
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

# Update the save_timetable function to use our new schedule functionality
@csrf_exempt
def save_timetable(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            section_id = data.get('sectionId')
            school_year = data.get('schoolYear', SchoolHelper.get_current_school_year())
            timetable_entries = data.get('entries', [])
            
            # Validate required fields
            if not section_id:
                return JsonResponse({'success': False, 'error': 'Section ID is required'})
            
            if not timetable_entries:
                return JsonResponse({'success': False, 'error': 'No timetable entries provided'})
            
            # Get the section
            try:
                section = Section.objects.get(id=section_id)
            except Section.DoesNotExist:
                return JsonResponse({'success': False, 'error': 'Section not found'})
            
            # Process each timetable entry
            saved_entries = []
            errors = []
            
            for entry in timetable_entries:
                try:
                    time_slot_id = entry.get('timeSlotId')
                    subject_id = entry.get('subjectId')
                    teacher_id = entry.get('teacherId')
                    
                    # Validate entry data
                    if not all([time_slot_id, subject_id, teacher_id]):
                        errors.append(f"Missing required fields in entry: {entry}")
                        continue
                    
                    # Get related objects
                    try:
                        time_slot = TimeSlot.objects.get(id=time_slot_id)
                        subject = Subject.objects.get(id=subject_id)
                        teacher = Teacher.objects.get(id=teacher_id)
                    except (TimeSlot.DoesNotExist, Subject.DoesNotExist, Teacher.DoesNotExist) as e:
                        errors.append(f"Related object not found: {str(e)}")
                        continue
                    
                    # Generate a unique schedule ID
                    schedule_id = entry.get('scheduleId')
                    if not schedule_id:
                        schedule_id = f"{time_slot.id}_{section.id}_{school_year}"
                    
                    # Create or update the schedule entry
                    schedule, created = Schedule.objects.update_or_create(
                        id=schedule_id,
                        defaults={
                            'time_slot': time_slot,
                            'section': section,
                            'subject': subject,
                            'teacher': teacher,
                            'school_year': school_year
                        }
                    )
                      # To save the entry in the response
                    saved_entries.append({
                        'id': schedule.id,
                        'timeSlotId': time_slot.id,
                        'day': time_slot.day,
                        'startTime': time_slot.start_time.strftime('%H:%M'),
                        'endTime': time_slot.end_time.strftime('%H:%M'),
                        'subjectId': subject.id,
                        'subjectName': subject.name,
                        'teacherId': teacher.id,
                        'teacherName': teacher.name,
                        'schoolYear': school_year  # Include school year in response
                    })
                    
                except Exception as e:
                    errors.append(f"Error processing entry: {str(e)}")
            
            # Return the results
            return JsonResponse({
                'success': True,
                'savedCount': len(saved_entries),
                'entries': saved_entries,
                'errors': errors,
                'hasErrors': len(errors) > 0
            })
            
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON data'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

# Adviser Management Endpoints
@csrf_exempt
def get_sections_with_advisers(request):
    school_year_range = request.GET.get('year', None)
    
    # If no school year specified, use the current school year
    if not school_year_range:
        school_year_range = SchoolHelper.get_current_school_year()
    
    # Get all sections
    sections = Section.objects.all()
    
    # Get all advisory assignments for this school year
    advisories = Advisory.objects.filter(school_year=school_year_range).select_related('teacher', 'section')
    
    # Create a lookup dictionary for advisories by section
    advisory_map = {advisory.section.id: advisory for advisory in advisories}
    
    result = []
    for section in sections:
        advisory = advisory_map.get(section.id)
        
        adviser_data = None
        if advisory and advisory.teacher:
            adviser_data = {
                'id': advisory.teacher.id,
                'name': advisory.teacher.name
            }
        
        section_data = {
            'sectionId': section.id,
            'sectionName': section.name,
            'gradeLevel': section.grade_level,
            'adviserId': advisory.teacher.id if advisory and advisory.teacher else None,
            'adviserName': advisory.teacher.name if advisory and advisory.teacher else None,
            'schoolYear': school_year_range
        }
        result.append(section_data)
    
    return JsonResponse(result, safe=False)

@csrf_exempt
def save_adviser(request):
    try:
        data = json.loads(request.body)
        section_id = data.get('section_id')
        teacher_id = data.get('teacher_id')
        school_year = data.get('school_year')
        
        if not section_id or not school_year:
            return JsonResponse({'success': False, 'error': 'Missing required data'})
        
        # Validate section exists
        section = Section.objects.filter(id=section_id).first()
        if not section:
            return JsonResponse({'success': False, 'error': 'Section not found'})
        
        # Validate teacher exists if provided
        teacher = None
        if teacher_id:
            teacher = Teacher.objects.filter(id=teacher_id).first()
            if not teacher:
                return JsonResponse({'success': False, 'error': 'Teacher not found'})
        
        # Check if an advisory already exists for this section and school year
        advisory, created = Advisory.objects.update_or_create(
            section=section,
            school_year=school_year,
            defaults={'teacher': teacher}
        )
        
        return JsonResponse({'success': True, 'created': created})
    except Exception as e:
        logger.error(f"Error saving adviser: {str(e)}")
        return JsonResponse({'success': False, 'error': str(e)})

@csrf_exempt
def remove_adviser(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Get required data
            section_id = data.get('section_id')
            school_year_range = data.get('school_year', SchoolHelper.get_current_school_year())
            
            # Validate required fields
            if not section_id:
                return JsonResponse({
                    'success': False, 
                    'error': 'Missing required field: section_id'
                })
            
            # Get the related objects
            try:
                section = Section.objects.get(id=section_id)
            except Section.DoesNotExist as e:
                return JsonResponse({
                    'success': False, 
                    'error': f'Related object not found: {str(e)}'
                })
            
            deleted, _ = Advisory.objects.filter(
                section=section,
                school_year=school_year_range
            ).delete()
            
            return JsonResponse({
                'success': True,
                'deleted': deleted > 0,
                'section_id': section_id
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

# TimeSlot Management Endpoints
@csrf_exempt
def get_timeslots(request):
    # TimeSlots are not associated with any specific school year
    timeslots = TimeSlot.objects.all().order_by('day', 'start_time')
    
    result = []
    for timeslot in timeslots:
        result.append({
            'id': timeslot.id,
            'start_time': timeslot.start_time.strftime('%H:%M'),
            'end_time': timeslot.end_time.strftime('%H:%M'),
            'day': timeslot.day
        })
    
    return JsonResponse(result, safe=False)

@csrf_exempt
def save_timeslot(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Get required data (no school year needed for timeslots)
            timeslot_id = data.get('id')
            start_time_str = data.get('start_time')
            end_time_str = data.get('end_time')
            day = data.get('day', 'All')
            
            # Log the received data for debugging
            logger.debug(f"TimeSlot save request: id={timeslot_id}, start={start_time_str}, end={end_time_str}, day={day}")
            
            # Validate required fields
            if not all([timeslot_id, start_time_str, end_time_str]):
                return JsonResponse({
                    'success': False, 
                    'error': 'Missing required fields. Please provide id, start_time, and end_time.'
                })
                
            # Convert time strings to proper time objects 
            from datetime import datetime
            
            try:
                # Try different time formats
                time_formats = ['%H:%M', '%H:%M:%S', '%I:%M %p', '%I:%M%p']
                start_time = None
                end_time = None
                
                for fmt in time_formats:
                    try:
                        start_time = datetime.strptime(start_time_str, fmt).time()
                        break
                    except ValueError:
                        continue
                        
                for fmt in time_formats:
                    try:
                        end_time = datetime.strptime(end_time_str, fmt).time()
                        break
                    except ValueError:
                        continue
                        
                if start_time is None:
                    raise ValueError(f"Could not parse start time: {start_time_str}")
                if end_time is None:
                    raise ValueError(f"Could not parse end time: {end_time_str}")
                    
                logger.debug(f"Parsed times: start={start_time}, end={end_time}")
                
            except Exception as e:
                logger.error(f"Time parsing error: {str(e)}")
                return JsonResponse({
                    'success': False,
                    'error': f'Invalid time format: {str(e)}'
                })
            
            # Create or update the timeslot
            timeslot, created = TimeSlot.objects.update_or_create(
                id=timeslot_id,
                defaults={
                    'start_time': start_time,
                    'end_time': end_time,
                    'day': day
                }
            )
            
            return JsonResponse({
                'success': True,
                'created': created,
                'id': timeslot.id,
                'start_time': timeslot.start_time.strftime('%H:%M'),
                'end_time': timeslot.end_time.strftime('%H:%M'),
                'day': timeslot.day
            })
            
        except Exception as e:
            logger.error(f"Error saving timeslot: {str(e)}")
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@csrf_exempt
def delete_timeslot(request, timeslot_id):
    if request.method == 'POST':
        try:
            # TimeSlot deletion is not tied to any school year
            timeslot = TimeSlot.objects.get(id=timeslot_id)
            timeslot.delete()
            return JsonResponse({'success': True})
        except TimeSlot.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'TimeSlot not found'})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@csrf_exempt
def get_timetable(request):
    section_id = request.GET.get('section')
    school_year = request.GET.get('year', SchoolHelper.get_current_school_year())
    
    if not section_id:
        return JsonResponse({'success': False, 'error': 'Section ID is required'})
    
    try:
        # Get the section
        section = Section.objects.get(id=section_id)
        
        # Get all time slots to build a complete timetable structure
        time_slots = TimeSlot.objects.all().order_by('day', 'start_time')
        
        # Get all schedules for this section
        schedules = Schedule.objects.filter(
            section_id=section_id,
            school_year=school_year
        ).select_related('time_slot', 'subject', 'teacher')
        
        # Create a lookup for quick access to schedule by time slot
        schedule_by_timeslot = {schedule.time_slot.id: schedule for schedule in schedules}
          # Group time slots by day for organized display
        days = {}
        for time_slot in time_slots:
            if time_slot.day not in days:
                days[time_slot.day] = []
            
            # Check if there's a schedule for this time slot
            schedule = schedule_by_timeslot.get(time_slot.id)
            
            slot_data = {
                'timeSlotId': time_slot.id,
                'startTime': time_slot.start_time.strftime('%H:%M'),
                'endTime': time_slot.end_time.strftime('%H:%M'),
                'hasSchedule': schedule is not None,
                'schoolYear': school_year
            }
            
            # Add schedule details if available
            if schedule:
                slot_data.update({
                    'scheduleId': schedule.id,
                    'subjectId': schedule.subject.id,
                    'subjectName': schedule.subject.name,
                    'teacherId': schedule.teacher.id,
                    'teacherName': schedule.teacher.name,
                    'schoolYear': schedule.school_year  # Use the schedule's school year
                })
            
            days[time_slot.day].append(slot_data)
        
        # Build results with section info and timetable data
        result = {
            'success': True,
            'section': {
                'id': section.id,
                'name': section.name,
                'gradeLevel': section.grade_level
            },
            'schoolYear': school_year,
            'timetable': days
        }
        
        return JsonResponse(result)
    
    except Section.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Section not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


def register(request):
    if request.method == 'POST':
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')
        
        # Validate inputs
        if not all([first_name, last_name, email, password, confirm_password]):
            return render(request, 'sign-in-eduplanner.html', {'error_message': 'All fields are required.'})
        
        if password != confirm_password:
            return render(request, 'sign-in-eduplanner.html', {'error_message': 'Passwords do not match.'})
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return render(request, 'sign-in-eduplanner.html', {'error_message': 'Email already registered.'})
        
        # Create user with email as username
        try:
            user = User.objects.create_user(
                username=email,  # We still need to set username as it's required by Django's User model
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            
            return render(request, 'log-in.html', {'success_message': 'Registration successful! Please log in.'})
        except Exception as e:
            return render(request, 'sign-in-eduplanner.html', {'error_message': f'Registration failed: {str(e)}'})
    
    return render(request, 'sign-in-eduplanner.html')

def registration_success(request):
    return render(request, 'registration_success.html')

def user_login(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        
        if not email or not password:
            return render(request, 'log-in.html', {'error_message': 'Please enter both email and password.'})
        
        # Find the user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return render(request, 'log-in.html', {'error_message': 'Invalid email or password.'})
        
        # Authenticate using the retrieved username
        user = authenticate(username=user.username, password=password)
        
        if user is not None:
            if user.is_active:
                login(request, user)
                # Redirect based on user role or other criteria
                return redirect('dashboard')
            else:
                return render(request, 'log-in.html', {'error_message': 'Your account is disabled.'})
        else:
            return render(request, 'log-in.html', {'error_message': 'Invalid email or password.'})
    
    return render(request, 'log-in.html')

def user_logout(request):
    logout(request)
    messages.success(request, 'You have been successfully logged out.')
    return redirect('index')


@login_required
def class_programs(request):
    # Using the SchoolHelper instead of SchoolYear model
    current_year = SchoolHelper.get_current_school_year()
    
    context = {
        'current_school_year': current_year
    }
    
    return render(request, 'class-programs.html', context)

# API endpoints for timetables
@login_required
def api_sections_with_timetables(request):
    year = request.GET.get('year', SchoolHelper.get_current_school_year())
    sections = Section.objects.all()
    advisories = Advisory.objects.filter(school_year=year).select_related('teacher', 'section')
    advisory_map = {advisory.section.id: advisory for advisory in advisories}
    schedules = Schedule.objects.filter(school_year=year).select_related('section', 'time_slot')
    sections_with_schedules = set(schedule.section.id for schedule in schedules)
    
    # Serialize the sections data
    sections_data = []
    for section in sections:
        advisory = advisory_map.get(section.id)
        adviser_name = advisory.teacher.name if advisory and advisory.teacher else None
        
        sections_data.append({
            'id': section.id,
            'name': section.name,
            'grade_level': section.grade_level,
            'adviser_name': adviser_name,
            'has_timetable': section.id in sections_with_schedules
        })
    
    return JsonResponse({
        'sections': sections_data,
        'school_year': year
    })

@login_required
def api_section_details(request, section_id):
    section = get_object_or_404(Section, id=section_id)
    school_year = request.GET.get('year', SchoolHelper.get_current_school_year())
    advisory = Advisory.objects.filter(
        section=section, 
        school_year=school_year
    ).select_related('teacher').first()
    
    adviser_name = advisory.teacher.name if advisory and advisory.teacher else None
    
    data = {
        'id': section.id,
        'name': section.name,
        'grade_level': section.grade_level,
        'adviser_name': adviser_name,
        'school_year': school_year
    }
    
    return JsonResponse(data)

@login_required
def api_timetable_details(request, section_id):
    section = get_object_or_404(Section, id=section_id)
    day = request.GET.get('day', 'Monday')  # Default to Monday if not specified
    school_year = request.GET.get('year', SchoolHelper.get_current_school_year())
    schedules = Schedule.objects.filter(
        section=section,
        time_slot__day=day,
        school_year=school_year
    ).select_related('time_slot', 'subject', 'teacher')
    
    time_slots_data = []
    for schedule in schedules:
        time_slots_data.append({
            'id': schedule.id,
            'start_time': schedule.time_slot.start_time.strftime('%H:%M'),
            'end_time': schedule.time_slot.end_time.strftime('%H:%M'),
            'subject_name': schedule.subject.name,
            'teacher_name': schedule.teacher.name
        })
        
    return JsonResponse({
        'section': section.name,
        'day': day,
        'school_year': school_year,
        'time_slots': time_slots_data
    })
@login_required
def api_section_timetable(request, section_id):
    """API to get timetable for a specific section and day"""
    section = get_object_or_404(Section, id=section_id)
    day = request.GET.get('day')
    year = request.GET.get('year', SchoolHelper.get_current_school_year())
    
    # Get all schedules for this section, day, and school year
    schedules = Schedule.objects.filter(
        section=section,
        time_slot__day=day,
        school_year=year
    ).select_related('time_slot', 'subject', 'teacher')
    
    # Transform schedules into time slots
    time_slots_data = []
    for schedule in schedules:
        time_slots_data.append({
            'id': schedule.id,
            'start_time': schedule.time_slot.start_time.strftime('%H:%M'),
            'end_time': schedule.time_slot.end_time.strftime('%H:%M'),
            'subject_name': schedule.subject.name,
            'teacher_name': schedule.teacher.name
        })
    
    # Return timetable data
    return JsonResponse({
        'section': section.name,
        'day': day,
        'school_year': year,
        'time_slots': time_slots_data
    })

@login_required
def api_export_timetable(request, section_id):
    section = get_object_or_404(Section, id=section_id)
    day = request.GET.get('day', 'Monday')
    school_year = request.GET.get('year', SchoolHelper.get_current_school_year())
    
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename=Timetable_{section.name}_{day}_{school_year}.pdf'
    
    return response

def register_user(request):
    if request.method == 'POST':
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')
        
        # Check if the email already exists
        if User.objects.filter(email=email).exists():
            messages.error(request, 'This email is already registered. Please use a different email address.')
            return redirect('sign_in')
        
        # Continue with user creation if validation passes
        if password == confirm_password:
            # Create the user with email as username
            user = User.objects.create_user(
                username=email,  # Still need username field in Django's User model
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            
            messages.success(request, 'Account created successfully! Please log in.')
            return redirect('login')
        else:
            messages.error(request, 'Passwords do not match.')
            return redirect('sign_in')
            
    return render(request, 'sign-in-eduplanner.html')

@require_POST
def check_email_exists(request):
    email = request.POST.get('email', '')
    exists = User.objects.filter(email=email).exists()
    return JsonResponse({'exists': exists})

@login_required
def update_profile(request):
    if request.method == 'POST':
        try:
            # Get data from request - now using separate name fields
            first_name = request.POST.get('first_name')
            last_name = request.POST.get('last_name')
            email = request.POST.get('email')
            contact_number = request.POST.get('contact_number')
            password_change_enabled = request.POST.get('password_change_enabled') == 'true'
            
            # Update user
            user = request.user
            user.first_name = first_name
            user.last_name = last_name
            user.email = email
            
            # Update password if needed
            if password_change_enabled:
                new_password = request.POST.get('new_password')
                if new_password:
                    user.set_password(new_password)
            
            user.save()
            
            # Check for different possible file field names
            photo = None
            if 'photo' in request.FILES:
                photo = request.FILES['photo']
            elif 'photo-upload' in request.FILES:
                photo = request.FILES['photo-upload']
            elif 'profile_photo' in request.FILES:
                photo = request.FILES['profile_photo']
            
            # Update profile if needed
            if hasattr(user, 'profile'):
                profile = user.profile
                if photo:
                    profile.photo = photo
                if contact_number:
                    profile.phone_number = contact_number
                profile.save()
            
            return JsonResponse({'success': True, 'message': 'Profile updated successfully'})
        except Exception as e:
            print(f"Error updating profile: {str(e)}")
            return JsonResponse({'success': False, 'message': f'Error: {str(e)}'}, status=400)
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=400)

@login_required
def verify_password(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            password = data.get('password', '')
            
            # Check if password is correct for current user
            success = request.user.check_password(password)
            
            return JsonResponse({'success': success})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})