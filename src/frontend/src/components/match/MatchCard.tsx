import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StarRating from '../feedback/StarRating';
import { Coins } from 'lucide-react';

export interface MatchCardData {
  id: string;
  name: string;
  skills: string[];
  rating: number;
  creditCost: number;
}

interface MatchCardProps {
  match: MatchCardData;
  onBook: (match: MatchCardData) => void;
}

export default function MatchCard({ match, onBook }: MatchCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all hover:-translate-y-1 duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{match.name}</span>
          <div className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
            <Coins className="h-4 w-4" />
            {match.creditCost}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {match.skills.map((skill, index) => (
            <Badge key={index} variant="secondary">
              {skill}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <StarRating rating={match.rating} readonly size="sm" />
          <span className="text-sm text-muted-foreground">({match.rating.toFixed(1)})</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => onBook(match)} 
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Book Session
        </Button>
      </CardFooter>
    </Card>
  );
}
