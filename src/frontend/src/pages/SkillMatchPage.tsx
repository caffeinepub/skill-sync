import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import MatchCard, { type MatchCardData } from '../components/match/MatchCard';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useLocalSessions } from '../hooks/useSessionsLocal';

const categories = ['All', 'Coding', 'Design', 'Music', 'Language', 'Math', 'Science'];

const mockMatches: MatchCardData[] = [
  { id: '1', name: 'Alex Chen', skills: ['Python', 'JavaScript', 'React'], rating: 4.8, creditCost: 50 },
  { id: '2', name: 'Sarah Miller', skills: ['UI/UX Design', 'Figma', 'Adobe XD'], rating: 4.9, creditCost: 60 },
  { id: '3', name: 'Marcus Johnson', skills: ['Guitar', 'Music Theory', 'Piano'], rating: 4.7, creditCost: 45 },
  { id: '4', name: 'Emma Wilson', skills: ['Spanish', 'French', 'Italian'], rating: 5.0, creditCost: 55 },
  { id: '5', name: 'David Lee', skills: ['Calculus', 'Linear Algebra', 'Statistics'], rating: 4.6, creditCost: 50 },
  { id: '6', name: 'Priya Patel', skills: ['Physics', 'Chemistry', 'Biology'], rating: 4.8, creditCost: 55 },
  { id: '7', name: 'Tom Anderson', skills: ['Java', 'C++', 'Data Structures'], rating: 4.9, creditCost: 65 },
  { id: '8', name: 'Lisa Brown', skills: ['Graphic Design', 'Illustration', 'Photoshop'], rating: 4.7, creditCost: 50 },
];

export default function SkillMatchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const { addSession } = useLocalSessions();

  const filteredMatches = mockMatches.filter((match) => {
    const matchesSearch = searchQuery === '' || 
      match.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' ||
      match.skills.some(skill => skill.toLowerCase().includes(selectedCategory.toLowerCase()));

    return matchesSearch && matchesCategory;
  });

  const handleBookSession = (match: MatchCardData) => {
    if (!identity) {
      toast.error('Please login to book a session');
      navigate({ to: '/login' });
      return;
    }

    // Add to local sessions
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    addSession({
      id: `session-${Date.now()}`,
      skill: match.skills[0],
      partnerName: match.name,
      date: tomorrow.toLocaleDateString(),
      time: '2:00 PM',
      status: 'scheduled',
    });

    toast.success(`Session booked with ${match.name}!`);
    navigate({ to: '/dashboard' });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Find Your Perfect Match</h1>
        <p className="text-muted-foreground">Connect with peers who can teach you new skills</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search by name or skill..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-lg"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            className="cursor-pointer px-4 py-2 text-sm hover:bg-primary/90 transition-colors"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Badge>
        ))}
      </div>

      {/* Match Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMatches.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground text-lg">No matches found. Try adjusting your search.</p>
          </div>
        ) : (
          filteredMatches.map((match) => (
            <MatchCard key={match.id} match={match} onBook={handleBookSession} />
          ))
        )}
      </div>
    </div>
  );
}
