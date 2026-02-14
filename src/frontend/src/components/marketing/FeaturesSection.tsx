import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Coins, Users, MessageCircle } from 'lucide-react';

const features = [
  {
    icon: Video,
    title: 'Live Classes',
    description: 'Connect with peers in real-time video sessions for interactive learning experiences.',
  },
  {
    icon: Coins,
    title: 'Credit System',
    description: 'Earn credits by teaching and use them to learn new skills from others.',
  },
  {
    icon: Users,
    title: 'Smart Matching',
    description: 'Find the perfect learning partner based on skills, ratings, and availability.',
  },
  {
    icon: MessageCircle,
    title: 'Doubt Solving',
    description: 'Get instant help and clarifications from experienced peers in your network.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Skill Sync?</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Everything you need for a seamless peer-to-peer learning experience
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card 
              key={index} 
              className="border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1 duration-300"
            >
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
