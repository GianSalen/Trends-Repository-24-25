"""
URL configuration for eduplanner project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path
from SchoolDetails_Manager import views
from SchoolDetails_Manager.views import check_email_exists

urlpatterns = [
    # Main view
    path('', views.index, name='index'),
    path('dashboard/', views.dashboard, name='dashboard'),
    
    # Authentication URLs
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('register/', views.register, name='register'),
    path('register/success/', views.registration_success, name='registration_success'),
    path('forgotpass/', views.forgot_password, name='forgotpass'),
    
    # Main pages
    path('dashboard/', views.dashboard, name='dashboard'),
    path('school_scheduling_details/', views.school_scheduling_details, name='school_scheduling_details'),
    path('class_programs/', views.class_programs, name='class_programs'),
    path('create_timetable/', views.create_timetable, name='create_timetable'),
    path('login/', views.login_page, name='login'),
    path('sign_in/', views.sign_in, name='sign_in'),
    path('forgot_password/', views.forgot_password, name='forgot_password'),
    path('register/', views.register, name='register'),
    path('register/success/', views.registration_success, name='registration_success'),
    path('profile_settings/', views.profile_settings, name='profile_settings'),
    
    # Legacy URLs (for backward compatibility)
    path('dashboard.html', views.dashboard, name='dashboard_html'),
    path('schoolSchedulingDetails.html', views.school_scheduling_details, name='school_scheduling_details_html'),
    path('class-programs.html', views.class_programs, name='class_programs_html'),
    path('create-timetable.html', views.create_timetable, name='create_timetable_html'),
    path('log-in.html', views.login_page, name='login_html'),
    path('sign-in-eduplanner.html', views.sign_in, name='sign_in_html'),
    path('forgotpass.html', views.forgot_password, name='forgot_password_html'),
    path('about/', views.about_page, name='about_page'),
    path('contact/', views.contact_page, name='contact_page'),
    
    # School Year endpoints
    path('api/school-year/current/', views.get_current_school_year, name='get_current_school_year'),
    path('api/school-year/save/', views.save_school_year, name='save_school_year'),
    
    # Teacher endpoints
    path('api/teachers/', views.get_teachers, name='get_teachers'),
    path('api/teachers/save/', views.save_teacher, name='save_teacher'),
    path('api/teachers/delete/<str:teacher_id>/', views.delete_teacher, name='delete_teacher'),
    
    # Section endpoints
    path('api/sections/', views.get_sections, name='get_sections'),
    path('api/sections/save/', views.save_section, name='save_section'),
    path('api/sections/delete/<str:section_id>/', views.delete_section, name='delete_section'),
    
    # Subject endpoints
    path('api/subjects/', views.get_subjects, name='get_subjects'),
    path('api/subjects/save/', views.save_subject, name='save_subject'),
    path('api/subjects/delete/<str:subject_id>/', views.delete_subject, name='delete_subject'),
    
    # Adviser endpoints
    path('api/advisers/save/', views.save_adviser, name='save_adviser'),
    path('api/advisers/remove/', views.remove_adviser, name='remove_adviser'),
    path('api/advisers/', views.get_sections_with_advisers, name='get_sections_with_advisers'),
    
    # Timeslot endpoints
    path('api/timeslots/', views.get_timeslots, name='get_timeslots'),
    path('api/timeslots/save/', views.save_timeslot, name='save_timeslot'),
    path('api/timeslots/delete/<str:timeslot_id>/', views.delete_timeslot, name='delete_timeslot'),
    
    # Schedule endpoints for timetable creation
    path('api/schedule/', views.get_schedule, name='get_schedule'),
    path('api/schedule/save/', views.save_schedule, name='save_schedule'),
    path('api/schedule/delete/<str:schedule_id>/', views.delete_schedule, name='delete_schedule'),
    path('api/schedule/teacher/<str:teacher_id>/', views.get_teacher_schedule, name='get_teacher_schedule'),
    path('api/schedule/section/<str:section_id>/', views.get_section_schedule, name='get_section_schedule'),
    path('api/schedule/check-conflicts/', views.check_conflicts, name='check_conflicts'),
    path('api/timetable/save/', views.save_timetable, name='save_timetable'),
    
    # Email verification
    path('check-email-exists/', check_email_exists, name='check_email_exists'),

    


]