# Generated by Django 5.2 on 2025-04-29 10:53

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('SchoolDetails_Manager', '0004_timeslot_remove_timetablecell_timetable_and_more'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='schedule',
            unique_together={('time_slot', 'section', 'school_year')},
        ),
    ]
