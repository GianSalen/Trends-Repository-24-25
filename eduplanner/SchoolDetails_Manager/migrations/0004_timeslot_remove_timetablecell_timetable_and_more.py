# Generated by Django 5.1.4 on 2025-04-27 03:06

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('SchoolDetails_Manager', '0003_remove_section_school_year_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='TimeSlot',
            fields=[
                ('id', models.CharField(max_length=50, primary_key=True, serialize=False)),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('day', models.CharField(max_length=20)),
            ],
        ),
        migrations.RemoveField(
            model_name='timetablecell',
            name='timetable',
        ),
        migrations.RemoveField(
            model_name='timetablecell',
            name='section',
        ),
        migrations.CreateModel(
            name='Schedule',
            fields=[
                ('id', models.CharField(max_length=100, primary_key=True, serialize=False)),
                ('school_year', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='SchoolDetails_Manager.schoolyear')),
                ('section', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='SchoolDetails_Manager.section')),
                ('subject', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='SchoolDetails_Manager.subject')),
                ('teacher', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='SchoolDetails_Manager.teacher')),
                ('time_slot', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='SchoolDetails_Manager.timeslot')),
            ],
        ),
        migrations.DeleteModel(
            name='Timetable',
        ),
        migrations.DeleteModel(
            name='TimetableCell',
        ),
    ]
