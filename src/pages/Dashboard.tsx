import { Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { StatsCards } from "@/components/dashboard/StatsCards";
import Tools from "./dashboard/Tools";
import AuditLogs from "./dashboard/AuditLogs";
import Projects from "./dashboard/Projects";
import Clients from "./dashboard/Clients";
import Invoices from "./dashboard/Invoices";
import Analytics from "./dashboard/Analytics";
import Profile from "./dashboard/Profile";
import Settings from "./dashboard/Settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  FileText, 
  Users, 
  Clock, 
  Star, 
  ArrowUpRight, 
  Calendar,
  Brain,
  Zap,
  FolderOpen,
  Bell
} from "lucide-react";

const recentProjects = [
  { 
    id: 1, 
    name: "Brand Redesign", 
    client: "Tech Corp", 
    status: "In Progress", 
    progress: 75,
    dueDate: "Dec 15, 2024" 
  },
  { 
    id: 2, 
    name: "Website Development", 
    client: "Startup Hub", 
    status: "Review", 
    progress: 90,
    dueDate: "Dec 20, 2024" 
  },
  { 
    id: 3, 
    name: "Marketing Campaign", 
    client: "Fashion Co", 
    status: "Planning", 
    progress: 25,
    dueDate: "Jan 5, 2025" 
  },
];

const favoriteTools = [
  { name: "PDF Merger", icon: FileText, usage: "127 times" },
  { name: "AI Content Generator", icon: Brain, usage: "89 times" },
  { name: "Invoice Creator", icon: FileText, usage: "76 times" },
  { name: "Document Converter", icon: Zap, usage: "54 times" },
];

const recentNotifications = [
  { 
    message: "New client inquiry from Sarah Johnson", 
    time: "2 hours ago", 
    type: "client" 
  },
  { 
    message: "Project 'Brand Redesign' milestone completed", 
    time: "4 hours ago", 
    type: "project" 
  },
  { 
    message: "Invoice #INV-001 has been paid", 
    time: "1 day ago", 
    type: "invoice" 
  },
];

// Main Dashboard Home Component
const DashboardHome = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner />
      
      {/* Stats Cards */}
      <StatsCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <Card className="lg:col-span-2 shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <FolderOpen className="mr-2 h-5 w-5" />
              Recent Projects
            </CardTitle>
            <Button variant="outline" size="sm">
              View All
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div 
                  key={project.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{project.name}</h4>
                      <Badge 
                        variant={
                          project.status === "In Progress" ? "default" :
                          project.status === "Review" ? "secondary" : 
                          "outline"
                        }
                      >
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-1 h-3 w-3" />
                      <span className="mr-4">{project.client}</span>
                      <Calendar className="mr-1 h-3 w-3" />
                      <span>{project.dueDate}</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="gradient-primary h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Notifications */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentNotifications.map((notification, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {notification.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Access Tools */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="mr-2 h-5 w-5" />
            Favorite Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {favoriteTools.map((tool, index) => (
              <div 
                key={index}
                className="p-4 rounded-lg border bg-card/50 hover:bg-card hover-lift cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                    <tool.icon className="h-5 w-5 text-white" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                </div>
                <h4 className="font-medium mb-1">{tool.name}</h4>
                <p className="text-xs text-muted-foreground">{tool.usage}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-gradient-subtle">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route index element={<DashboardHome />} />
              <Route path="tools" element={<Tools />} />
              <Route path="tools/:toolId" element={<Tools />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="projects" element={<Projects />} />
              <Route path="clients" element={<Clients />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;