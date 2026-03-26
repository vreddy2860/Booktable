from django import forms
from .models import RestaurantPhoto, Restaurant

class RestaurantPhotoForm(forms.ModelForm):
    class Meta:
        model = RestaurantPhoto
        fields = ['restaurant', 'image', 'caption', 'is_primary']
        widgets = {
            'image': forms.FileInput(attrs={'accept': 'image/*'}),
        }

    def save(self, commit=True):
        instance = super().save(commit=False)
        
        # Debug output
        print(f"Saving photo with image: {self.cleaned_data.get('image')}")
        print(f"Initial image value: {self.initial.get('image') if hasattr(self, 'initial') else 'No initial'}")
        
        if commit:
            instance.save()
            
        return instance
