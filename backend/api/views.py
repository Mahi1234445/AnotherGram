from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from .models import User, Post, Comment, Follow, Like, Notification, FollowRequest, Story
from .serializers import (
    UserSerializer, PostSerializer, CommentSerializer, FollowSerializer, 
    NotificationSerializer, FollowRequestSerializer, StorySerializer
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'username'

    def get_serializer_context(self):
        return {'request': self.request}

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        Story.objects.filter(user=instance).delete()
        Follow.objects.filter(Q(follower=instance) | Q(following=instance)).delete()
        FollowRequest.objects.filter(Q(sender=instance) | Q(receiver=instance)).delete()
        Notification.objects.filter(Q(sender=instance) | Q(receiver=instance)).delete()
        Like.objects.filter(user=instance).delete()
        Comment.objects.filter(user=instance).delete()
        Post.objects.filter(user=instance).delete()

        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def follow(self, request, username=None):
        target = self.get_object()
        user = request.user
        if user == target:
            return Response({'error': 'Self follow'}, status=400)
        
        if Follow.objects.filter(follower=user, following=target).exists():
            return Response({'message': 'Already following'})

        if FollowRequest.objects.filter(sender=user, receiver=target).exists():
            return Response({'message': 'Request pending'})

        if target.is_private:
            FollowRequest.objects.create(sender=user, receiver=target)
            Notification.objects.create(sender=user, receiver=target, type='request')
            return Response({'status': 'requested'})
            
        Follow.objects.create(follower=user, following=target)
        Notification.objects.create(sender=user, receiver=target, type='follow')
        return Response({'status': 'followed'})

    @action(detail=True, methods=['post'])
    def unfollow(self, request, username=None):
        target = self.get_object()
        Follow.objects.filter(follower=request.user, following=target).delete()
        FollowRequest.objects.filter(sender=request.user, receiver=target).delete()
        return Response({'status': 'unfollowed'})

    @action(detail=True, methods=['get'])
    def followers(self, request, username=None):
        user = self.get_object()
        data = [f.follower for f in user.followers_set.all()]
        return Response(self.get_serializer(data, many=True).data)

    @action(detail=True, methods=['get'])
    def following(self, request, username=None):
        user = self.get_object()
        data = [f.following for f in user.following_set.all()]
        return Response(self.get_serializer(data, many=True).data)

    @action(detail=False, methods=['post'])
    def toggle_privacy(self, request):
        user = request.user
        user.is_private = not user.is_private
        user.save()
        return Response({'status': 'updated', 'is_private': user.is_private})

    @action(detail=False, methods=['get'])
    def requests(self, request):
        qs = FollowRequest.objects.filter(receiver=request.user).order_by('-created_at')
        return Response(FollowRequestSerializer(qs, many=True).data)

    @action(detail=True, methods=['post'])
    def accept_request(self, request, username=None):
        sender = get_object_or_404(User, username=request.data.get('username'))
        freq = FollowRequest.objects.filter(sender=sender, receiver=request.user).first()
        if freq:
            Follow.objects.create(follower=sender, following=request.user)
            freq.delete()
            Notification.objects.create(sender=sender, receiver=request.user, type='follow') 
            return Response({'status': 'accepted'})
        return Response({'error': 'Not found'}, status=404)

    @action(detail=True, methods=['post'])
    def decline_request(self, request, username=None):
        sender = get_object_or_404(User, username=request.data.get('username'))
        FollowRequest.objects.filter(sender=sender, receiver=request.user).delete()
        return Response({'status': 'declined'})

class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Post.objects.all().order_by('-created_at')
        username = self.request.query_params.get('username')
        user = self.request.user
        
        if username:
            target = get_object_or_404(User, username=username)
            if user == target or not target.is_private or Follow.objects.filter(follower=user, following=target).exists():
                return qs.filter(user=target)
            return qs.none()
            
        return qs.filter(
            Q(user__is_private=False) | Q(user=user) | Q(user__followers_set__follower=user)
        ).distinct()

    @action(detail=False, methods=['get'])
    def feed(self, request):
        ids = request.user.following_set.values_list('following', flat=True)
        posts = Post.objects.filter(user__id__in=ids).order_by('-created_at')
        return Response(self.get_serializer(posts, many=True).data)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        obj, created = Like.objects.get_or_create(user=request.user, post=post)
        if created and request.user != post.user:
            Notification.objects.create(sender=request.user, receiver=post.user, post=post, type='like')
        return Response({'status': 'liked'})

    @action(detail=True, methods=['post'])
    def unlike(self, request, pk=None):
        Like.objects.filter(user=request.user, post=self.get_object()).delete()
        return Response({'status': 'unliked'})

    @action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        post = self.get_object()
        text = request.data.get('text')
        Comment.objects.create(user=request.user, post=post, text=text)
        if request.user != post.user:
            Notification.objects.create(sender=request.user, receiver=post.user, post=post, type='comment', text=text)
        return Response({'status': 'commented'})

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        comments = self.get_object().comments.all().order_by('created_at')
        return Response(CommentSerializer(comments, many=True).data)

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(receiver=self.request.user).order_by('-created_at')

class StoryViewSet(viewsets.ModelViewSet):
    serializer_class = StorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Story.objects.filter(
            (Q(user=user) | Q(user__followers_set__follower=user)),
            expires_at__gt=timezone.now()
        ).select_related('user').distinct().order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        if self.get_object().user != request.user:
            return Response({'error': 'Unauthorized'}, status=403)
        return super().destroy(request, *args, **kwargs)
