# Generated by Django 5.2 on 2025-05-16 07:02

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('SchoolDetails_Manager', '0009_remove_subject_grade_level_remove_subject_semester'),
    ]

    operations = [
        migrations.CreateModel(
            name='SchoolYear',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=20)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('is_current', models.BooleanField(default=False)),
            ],
            options={
                'ordering': ['-start_date'],
            },
        ),
        migrations.AlterField(
            model_name='section',
            name='grade_level',
            field=models.PositiveSmallIntegerField(),
        ),
        migrations.AlterField(
            model_name='section',
            name='id',
            field=models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID'),
        ),
        migrations.AddField(
            model_name='section',
            name='school_year',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='SchoolDetails_Manager.schoolyear'),
        ),
        migrations.CreateModel(
            name='Timetable',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('day', models.CharField(max_length=10)),
                ('is_published', models.BooleanField(default=False)),
                ('section', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='SchoolDetails_Manager.section')),
            ],
        ),
    ]
