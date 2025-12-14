from rest_framework import serializers
from .models import User, Post, Comment, Follow, Like, Notification, FollowRequest, Story

class UserSerializer(serializers.ModelSerializer):
    followers_count = serializers.IntegerField(read_only=True)
    following_count = serializers.IntegerField(read_only=True)
    password = serializers.CharField(write_only=True)
    is_following = serializers.SerializerMethodField()
    has_requested = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'profile_picture', 'bio', 'followers_count', 'following_count', 'is_following', 'is_private', 'has_requested']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(follower=request.user, following=obj).exists()
        return False

    def get_has_requested(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return FollowRequest.objects.filter(sender=request.user, receiver=obj).exists()
        return False

class CommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    profile_picture = serializers.ImageField(source='user.profile_picture', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'user', 'username', 'profile_picture', 'post', 'text', 'created_at']
        read_only_fields = ['user', 'post', 'created_at']

class PostSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_profile_picture = serializers.ImageField(source='user.profile_picture', read_only=True)
    is_liked = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Post
        fields = ['id', 'user', 'username', 'user_profile_picture', 'image', 'caption', 'created_at', 'likes_count', 'comments_count', 'is_liked']
        read_only_fields = ['user', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(user=request.user, post=obj).exists()
        return False

class StorySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_profile_picture = serializers.ImageField(source='user.profile_picture', read_only=True)

    class Meta:
        model = Story
        fields = ['id', 'user', 'username', 'user_profile_picture', 'image', 'created_at', 'expires_at']
        read_only_fields = ['user', 'created_at', 'expires_at']
        
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ['follower', 'following', 'created_at']

class FollowRequestSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_profile_picture = serializers.ImageField(source='sender.profile_picture', read_only=True)

    class Meta:
        model = FollowRequest
        fields = ['id', 'sender', 'sender_username', 'sender_profile_picture', 'created_at']

class NotificationSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_profile_picture = serializers.ImageField(source='sender.profile_picture', read_only=True)
    post_image = serializers.FileField(source='post.image', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'sender', 'sender_username', 'sender_profile_picture', 'receiver', 'type', 'post', 'post_image', 'text', 'created_at', 'is_read']
