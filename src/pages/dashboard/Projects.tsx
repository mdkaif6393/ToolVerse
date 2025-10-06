import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Search, 
  Calendar,
  Users,
  Clock,
  MoreHorizontal,
  Filter
} from "lucide-react";

const projects = [
  {
    id: 1,
    name: "Brand Redesign for Tech Corp",
    client: "Tech Corp Inc.",
    status: "In Progress",
    priority: "High",
    progress: 75,
    dueDate: "Dec 15, 2024",
    team: ["JD", "SM", "AK"],
    description: "Complete brand identity redesign including logo, colors, and guidelines."
  },
  {
    id: 2,
    name: "Website Development",
    client: "Startup Hub",
    status: "Review",
    priority: "Medium",
    progress: 90,
    dueDate: "Dec 20, 2024",
    team: ["JD", "MR"],
    description: "Modern responsive website with custom CMS integration."
  },
  {
    id: 3,
    name: "Marketing Campaign",
    client: "Fashion Co",
    status: "Planning",
    priority: "Low",
    progress: 25,
    dueDate: "Jan 5, 2025",
    team: ["SM"],
    description: "Multi-channel marketing campaign for spring collection launch."
  },
  {
    id: 4,
    name: "Mobile App Design",
    client: "FinTech Solutions",
    status: "In Progress",
    priority: "High",
    progress: 60,
    dueDate: "Jan 15, 2025",
    team: ["AK", "MR", "JD"],
    description: "UI/UX design for financial management mobile application."
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "In Progress": return "default";
    case "Review": return "secondary";
    case "Planning": return "outline";
    default: return "outline";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High": return "destructive";
    case "Medium": return "secondary";
    case "Low": return "outline";
    default: return "outline";
  }
};

const Projects = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your client projects
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects..."
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="hover-lift">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{project.name}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <Users className="mr-1 h-3 w-3" />
                    <span className="mr-4">{project.client}</span>
                    <Calendar className="mr-1 h-3 w-3" />
                    <span>{project.dueDate}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {project.description}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Status and Priority */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                    <Badge variant={getPriorityColor(project.priority)}>
                      {project.priority}
                    </Badge>
                  </div>
                  <div className="flex -space-x-2">
                    {project.team.map((member, index) => (
                      <Avatar key={index} className="h-8 w-8 border-2 border-background">
                        <AvatarFallback className="text-xs">{member}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="gradient-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1">
                    Update Progress
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Projects;