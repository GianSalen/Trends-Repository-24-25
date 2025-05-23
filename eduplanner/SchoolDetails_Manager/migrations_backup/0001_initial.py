# Generated by Django 5.1.4 on 2025-04-25 12:46

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='SchoolYear',
            fields=[
                ('year_range', models.CharField(max_length=9, primary_key=True, serialize=False)),
                ('is_current', models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name='Subject',
            fields=[
                ('id', models.CharField(max_length=20, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('grade_level', models.IntegerField()),
                ('semester', models.CharField(blank=True, max_length=1, null=True)),
                ('school_year', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='SchoolDetails_Manager.schoolyear')),
            ],
        ),
        migrations.CreateModel(
            name='Teacher',
            fields=[
                ('id', models.CharField(max_length=20, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('specialization', models.JSONField()),
                ('category', models.CharField(default='Regular', max_length=50)),
                ('teaching_load', models.IntegerField(default=6)),
                ('school_year', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='SchoolDetails_Manager.schoolyear')),
            ],
        ),
        migrations.CreateModel(
            name='Section',
            fields=[
                ('id', models.CharField(max_length=20, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('grade_level', models.IntegerField()),
                ('school_year', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='SchoolDetails_Manager.schoolyear')),
                ('adviser', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='SchoolDetails_Manager.teacher')),
            ],
        ),
    ]
