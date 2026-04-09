import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Star, Medal, Crown } from 'lucide-react';
import { api } from '@/api';
import { User, LeaderboardUser } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface LeaderboardProps {
  user?: User | null;
}

export function Leaderboard({ user }: LeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await api.getLeaderboard();
      
      if (response.success) {
        setLeaderboardData(response.data.users);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load leaderboard",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load leaderboard",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Medal className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const getMedalEmoji = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  const getPositionBackground = (position: number, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return 'bg-primary/10 border-primary/20 ring-2 ring-primary/20';
    }
    
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/20';
      case 2:
        return 'bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-400/20';
      case 3:
        return 'bg-gradient-to-r from-amber-600/10 to-amber-700/10 border-amber-600/20';
      default:
        return 'bg-card border-border';
    }
  };

  const currentUserPosition = leaderboardData.findIndex(u => u.id === user.id) + 1;
  const top5Users = leaderboardData.slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <h1 className="text-4xl font-bold">Leaderboard</h1>
          <Trophy className="h-8 w-8 text-yellow-500" />
        </div>
        <p className="text-muted-foreground text-lg">
          Top contributors making a difference in the community
        </p>
      </div>

      {/* Current User Stats */}
      {currentUserPosition > 0 && (
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-blue/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/placeholder-avatar.jpg" alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg">{user.name}</h3>
                  <p className="text-muted-foreground">Your position</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-2xl font-bold">{user.points}</span>
                  <span className="text-muted-foreground">points</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getMedalIcon(currentUserPosition)}
                  <span className="font-semibold">
                    {currentUserPosition <= 3 ? getMedalEmoji(currentUserPosition) : `Rank #${currentUserPosition}`}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 5 Leaderboard */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <span>Top 5 Contributors</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 rounded-lg border">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))
          ) : top5Users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No leaderboard data available
            </div>
          ) : (
            top5Users.map((leaderUser, index) => {
              const position = index + 1;
              const isCurrentUser = leaderUser.id === user.id;
              
              return (
                <div
                  key={leaderUser.id}
                  className={`
                    flex items-center space-x-4 p-4 rounded-lg border transition-all
                    ${getPositionBackground(position, isCurrentUser)}
                    ${isCurrentUser ? 'shadow-lg' : ''}
                  `}
                >
                  {/* Position and Medal */}
                  <div className="flex items-center justify-center w-12 h-12">
                    {getMedalIcon(position)}
                  </div>

                  {/* User Avatar */}
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src="/placeholder-avatar.jpg" 
                      alt={leaderUser.name} 
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {leaderUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-semibold ${isCurrentUser ? 'text-primary font-bold' : ''}`}>
                        {leaderUser.name}
                      </h3>
                      {isCurrentUser && (
                        <Badge variant="default" className="text-xs">
                          You
                        </Badge>
                      )}
                      {getMedalEmoji(position) && (
                        <span className="text-lg">{getMedalEmoji(position)}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {position === 1 ? 'Community Champion' :
                       position === 2 ? 'Problem Solver' :
                       position === 3 ? 'Active Contributor' :
                       'Community Helper'}
                    </p>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-xl font-bold">{leaderUser.points}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Point System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>How to Earn Points</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span>Report an issue</span>
                <Badge variant="secondary">+5 points</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span>Upvote an issue</span>
                <Badge variant="secondary">+2 points</Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span>Issue gets fixed (reporter)</span>
                <Badge variant="secondary">+10 points</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span>Verify issue (authority)</span>
                <Badge variant="secondary">+3 points</Badge>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <h4 className="font-semibold text-primary mb-2">💡 Pro Tip</h4>
            <p className="text-sm text-muted-foreground">
              Be an active community member! Report issues accurately, vote on problems that affect you, 
              and help authorities prioritize by providing detailed descriptions and locations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* View Full Leaderboard Link */}
      {leaderboardData.length > 5 && (
        <div className="text-center mt-8">
          <button 
            onClick={() => {
              toast({
                title: "Coming Soon",
                description: "Full leaderboard view will be available in the next update"
              });
            }}
            className="text-primary hover:underline font-medium"
          >
            View full leaderboard ({leaderboardData.length - 5} more contributors)
          </button>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
