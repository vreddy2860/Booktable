from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer, 
    UserProfileSerializer
)

User = get_user_model()

class IsAdminUser(permissions.BasePermission):
    """
    Permission for admin users only
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == User.ADMIN

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom token view that uses our enhanced serializer
    """
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    """
    API endpoint for user registration
    """
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for user profile management
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class UsersListView(generics.ListAPIView):
    """
    API endpoint to list all users (admin only)
    """
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAdminUser]

class ChangeRoleView(APIView):
    """
    API endpoint to change user role (admin only)
    """
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        new_role = request.data.get('role')
        if new_role not in [role[0] for role in User.ROLE_CHOICES]:
            return Response({"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)
        
        user.role = new_role
        user.save()
        return Response({"message": f"User role updated to {new_role}"})
