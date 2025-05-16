from django.db import models

class Teacher(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    name = models.CharField(max_length=100)
    specialization = models.JSONField()  # Store as JSON array
    teaching_load = models.IntegerField(default=6)
    
    def __str__(self):
        return f"{self.id} - {self.name}"

class Section(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    name = models.CharField(max_length=100)
    grade_level = models.IntegerField()
    
    def __str__(self):
        return f"{self.name} (Grade {self.grade_level})"

class Subject(models.Model):
    id = models.CharField(max_length=20, primary_key=True)
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return f"{self.name} (Grade {self.grade_level})"

class TimeSlot(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    day = models.CharField(max_length=20)
    
    def __str__(self):
        return f"{self.id} - {self.day} {self.start_time}-{self.end_time}"
    
class Advisory(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, null=True, blank=True)
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    school_year = models.CharField(max_length=9)  # e.g., "2023-2024"
    
    class Meta:
        unique_together = ('section', 'school_year')
    
    def __str__(self):
        teacher_name = self.teacher.name if self.teacher else "No Adviser Assigned"
        return f"{teacher_name} - {self.section.name} ({self.school_year})"

class Schedule(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.CASCADE)
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    school_year = models.CharField(max_length=9)  # e.g., "2023-2024"
    
    class Meta:
        unique_together = ('time_slot', 'section', 'school_year')
    
    def __str__(self):
        return f"{self.section.name} - {self.subject.name} ({self.time_slot}) - {self.school_year}"

