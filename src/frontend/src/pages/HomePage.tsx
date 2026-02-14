import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import FeaturesSection from '../components/marketing/FeaturesSection';
import HowItWorksSection from '../components/marketing/HowItWorksSection';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Computer Science Student',
    content: 'Skill Sync helped me learn web development while teaching others Python. The credit system is genius!',
    rating: 5,
  },
  {
    name: 'Marcus Johnson',
    role: 'Design Student',
    content: 'I\'ve improved my design skills and made great connections. The live sessions are incredibly helpful.',
    rating: 5,
  },
  {
    name: 'Priya Patel',
    role: 'Music Student',
    content: 'Teaching guitar and learning music theory has been an amazing experience. Highly recommend!',
    rating: 5,
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();

  const handleStartLearning = () => {
    navigate({ to: '/skill-match' });
  };

  const handleStartTeaching = () => {
    if (identity) {
      navigate({ to: '/dashboard' });
    } else {
      navigate({ to: '/login' });
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16 md:py-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Learn. Teach. Earn.
            </span>
            <br />
            Grow Together.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Join a vibrant community of students exchanging skills through live classes. 
            Earn credits by teaching and use them to learn new skills from your peers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              onClick={handleStartLearning}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8"
            >
              Start Learning
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleStartTeaching}
              className="text-lg px-8 border-2"
            >
              Start Teaching
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Students Say</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join thousands of students already growing their skills
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{testimonial.name}</CardTitle>
                <CardDescription>{testimonial.role}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                <div className="flex gap-1 mt-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
