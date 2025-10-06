import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  MessageSquare, 
  GitBranch, 
  Eye, 
  Edit3, 
  Share2, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Screen,
  Send,
  Plus,
  Settings,
  Crown,
  Shield,
  UserCheck,
  GitCommit,
  GitMerge,
  History,
  Bell,
  Zap,
  Code2
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'owner' | 'admin' | 'developer' | 'viewer';
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  currentActivity?: string;
}

interface Comment {
  id: string;
  author: TeamMember;
  content: string;
  timestamp: Date;
  lineNumber?: number;
  resolved: boolean;
  replies: Comment[];
}

interface Version {
  id: string;
  author: TeamMember;
  message: string;
  timestamp: Date;
  changes: number;
  status: 'draft' | 'review' | 'approved' | 'merged';
}

interface LiveSession {
  id: string;
  participants: TeamMember[];
  isRecording: boolean;
  startTime: Date;
  type: 'code_review' | 'pair_programming' | 'meeting';
}

const TeamWorkspace = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [liveSession, setLiveSession] = useState<LiveSession | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTeamData();
    // Simulate real-time updates
    const interval = setInterval(() => {
      updateMemberActivity();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadTeamData = () => {
    // Mock team data
    const mockMembers: TeamMember[] = [
      {
        id: '1',
        name: 'Rahul Sharma',
        email: 'rahul@company.com',
        avatar: '/api/placeholder/32/32',
        role: 'owner',
        status: 'online',
        lastSeen: new Date(),
        currentActivity: 'Editing main.tsx'
      },
      {
        id: '2',
        name: 'Priya Patel',
        email: 'priya@company.com',
        avatar: '/api/placeholder/32/32',
        role: 'admin',
        status: 'online',
        lastSeen: new Date(),
        currentActivity: 'Reviewing dependencies'
      },
      {
        id: '3',
        name: 'Amit Kumar',
        email: 'amit@company.com',
        avatar: '/api/placeholder/32/32',
        role: 'developer',
        status: 'away',
        lastSeen: new Date(Date.now() - 300000),
        currentActivity: 'Testing live preview'
      },
      {
        id: '4',
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        avatar: '/api/placeholder/32/32',
        role: 'viewer',
        status: 'offline',
        lastSeen: new Date(Date.now() - 3600000)
      }
    ];

    const mockComments: Comment[] = [
      {
        id: '1',
        author: mockMembers[1],
        content: 'इस function में error handling add करनी चाहिए। What do you think?',
        timestamp: new Date(Date.now() - 1800000),
        lineNumber: 45,
        resolved: false,
        replies: [
          {
            id: '1-1',
            author: mockMembers[0],
            content: 'Good point! I\'ll add try-catch blocks here.',
            timestamp: new Date(Date.now() - 1500000),
            resolved: false,
            replies: []
          }
        ]
      },
      {
        id: '2',
        author: mockMembers[2],
        content: 'Performance looks great! Bundle size भी optimize हो गया है।',
        timestamp: new Date(Date.now() - 900000),
        resolved: true,
        replies: []
      }
    ];

    const mockVersions: Version[] = [
      {
        id: 'v1',
        author: mockMembers[0],
        message: 'Added live preview functionality with multi-device support',
        timestamp: new Date(Date.now() - 7200000),
        changes: 15,
        status: 'merged'
      },
      {
        id: 'v2',
        author: mockMembers[1],
        message: 'Enhanced dependency management with security scanning',
        timestamp: new Date(Date.now() - 3600000),
        changes: 8,
        status: 'approved'
      },
      {
        id: 'v3',
        author: mockMembers[2],
        message: 'Work in progress: Analytics dashboard improvements',
        timestamp: new Date(Date.now() - 1800000),
        changes: 3,
        status: 'draft'
      }
    ];

    setTeamMembers(mockMembers);
    setComments(mockComments);
    setVersions(mockVersions);
  };

  const updateMemberActivity = () => {
    const activities = [
      'Editing components',
      'Reviewing code',
      'Testing features',
      'Writing documentation',
      'Debugging issues',
      'Optimizing performance'
    ];

    setTeamMembers(prev => prev.map(member => {
      if (member.status === 'online' && Math.random() > 0.7) {
        return {
          ...member,
          currentActivity: activities[Math.floor(Math.random() * activities.length)]
        };
      }
      return member;
    }));
  };

  const startLiveSession = (type: LiveSession['type']) => {
    const session: LiveSession = {
      id: Date.now().toString(),
      participants: teamMembers.filter(m => m.status === 'online'),
      isRecording: false,
      startTime: new Date(),
      type
    };
    setLiveSession(session);
  };

  const addComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: teamMembers[0], // Current user
      content: newComment,
      timestamp: new Date(),
      resolved: false,
      replies: []
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  const getRoleIcon = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner': return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'admin': return <Shield className="h-3 w-3 text-blue-500" />;
      case 'developer': return <Code2 className="h-3 w-3 text-green-500" />;
      case 'viewer': return <Eye className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TeamMember['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
    }
  };

  const getVersionStatusColor = (status: Version['status']) => {
    switch (status) {
      case 'merged': return 'bg-green-100 text-green-800 border-green-200';
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Workspace
              <Badge variant="outline" className="ml-2">
                {teamMembers.filter(m => m.status === 'online').length} online
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={() => startLiveSession('meeting')} variant="outline" size="sm">
                <Video className="mr-2 h-4 w-4" />
                Start Meeting
              </Button>
              <Button onClick={() => startLiveSession('code_review')} variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                Code Review
              </Button>
              <Button onClick={() => startLiveSession('pair_programming')} size="sm">
                <Code2 className="mr-2 h-4 w-4" />
                Pair Program
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Live Session Banner */}
      {liveSession && (
        <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">
                  Live {liveSession.type.replace('_', ' ')} session active
                </span>
                <Badge variant="outline">
                  {liveSession.participants.length} participants
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={isVideoEnabled ? "default" : "outline"}
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                >
                  {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant={isAudioEnabled ? "default" : "outline"}
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                >
                  {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant={isScreenSharing ? "default" : "outline"}
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                >
                  <Screen className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setLiveSession(null)}>
                  End Session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="versions">Version History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Team Activity */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Real-time Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {teamMembers
                  .filter(m => m.status === 'online')
                  .map(member => (
                    <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(member.status)}`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.name}</span>
                          {getRoleIcon(member.role)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {member.currentActivity || 'Active'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Team Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Members</span>
                  <span className="font-medium">{teamMembers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Online Now</span>
                  <span className="font-medium text-green-600">
                    {teamMembers.filter(m => m.status === 'online').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Comments</span>
                  <span className="font-medium">
                    {comments.filter(c => !c.resolved).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pending Reviews</span>
                  <span className="font-medium text-yellow-600">
                    {versions.filter(v => v.status === 'review').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { user: 'Rahul Sharma', action: 'merged pull request', target: 'Live Preview Feature', time: '2 minutes ago', type: 'merge' },
                  { user: 'Priya Patel', action: 'commented on', target: 'dependency-manager.tsx:45', time: '15 minutes ago', type: 'comment' },
                  { user: 'Amit Kumar', action: 'started live session', target: 'Code Review', time: '1 hour ago', type: 'session' },
                  { user: 'Sarah Johnson', action: 'joined workspace', target: 'Team Collaboration', time: '2 hours ago', type: 'join' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-1">
                      {activity.type === 'merge' && <GitMerge className="h-4 w-4 text-green-500" />}
                      {activity.type === 'comment' && <MessageSquare className="h-4 w-4 text-blue-500" />}
                      {activity.type === 'session' && <Video className="h-4 w-4 text-purple-500" />}
                      {activity.type === 'join' && <UserCheck className="h-4 w-4 text-orange-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user}</span>{' '}
                        {activity.action}{' '}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <div className="grid gap-4">
            {teamMembers.map(member => (
              <Card key={member.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${getStatusColor(member.status)}`}></div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{member.name}</h3>
                          {getRoleIcon(member.role)}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.status === 'online' 
                            ? member.currentActivity || 'Active now'
                            : `Last seen ${member.lastSeen.toLocaleString()}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getVersionStatusColor('approved')}>
                        {member.role}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          {/* Add Comment */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <Textarea
                  placeholder="Add a comment... (Hindi/English both supported)"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bell className="h-4 w-4" />
                    Team will be notified
                  </div>
                  <Button onClick={addComment} disabled={!newComment.trim()}>
                    <Send className="mr-2 h-4 w-4" />
                    Comment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map(comment => (
              <Card key={comment.id} className={comment.resolved ? 'opacity-60' : ''}>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.author.avatar} />
                          <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{comment.author.name}</span>
                            {getRoleIcon(comment.author.role)}
                            {comment.lineNumber && (
                              <Badge variant="outline" className="text-xs">
                                Line {comment.lineNumber}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {comment.timestamp.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {comment.resolved ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Button size="sm" variant="outline">
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm pl-11">{comment.content}</p>
                    
                    {/* Replies */}
                    {comment.replies.length > 0 && (
                      <div className="pl-11 space-y-2 border-l-2 border-muted ml-4">
                        {comment.replies.map(reply => (
                          <div key={reply.id} className="pl-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={reply.author.avatar} />
                                <AvatarFallback className="text-xs">{reply.author.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{reply.author.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {reply.timestamp.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm pl-8">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <div className="space-y-4">
            {versions.map(version => (
              <Card key={version.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <GitCommit className="h-5 w-5 mt-1 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{version.message}</span>
                          <Badge className={getVersionStatusColor(version.status)}>
                            {version.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={version.author.avatar} />
                              <AvatarFallback className="text-xs">{version.author.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{version.author.name}</span>
                          </div>
                          <span>{version.changes} changes</span>
                          <span>{version.timestamp.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {version.status === 'draft' && (
                        <Button size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamWorkspace;
