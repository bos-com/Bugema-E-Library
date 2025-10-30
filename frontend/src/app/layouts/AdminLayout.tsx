import { Outlet, Link, useLocation } from "react-router-dom";
import { BookOpen, Users, BarChart3, Settings, LogOut } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

export default function AdminLayout() {
	const location = useLocation();
	const { user, logout } = useAuthStore();

	const navigation = [
		{ name: "Books", href: "/admin/books", icon: BookOpen },
		{ name: "Categories", href: "/admin/categories", icon: Settings },
		{ name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
	];

	return (
		<div className="min-h-screen bg-background">
			{/* Sidebar */}
			<div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r">
				<div className="flex h-full flex-col">
					{/* Logo */}
					<div className="flex h-16 items-center px-6 border-b">
						<div className="flex items-center space-x-2">
							<BookOpen className="h-6 w-6 text-primary" />
							<span className="text-xl font-bold">
								E-Library Admin
							</span>
						</div>
					</div>

					{/* Navigation */}
					<nav className="flex-1 space-y-1 px-3 py-4">
						{navigation.map((item) => {
							const isActive = location.pathname === item.href;
							return (
								<Link
									key={item.name}
									to={item.href}
									className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
										isActive
											? "bg-primary text-primary-foreground"
											: "text-muted-foreground hover:bg-muted hover:text-foreground"
									}`}
								>
									<item.icon className="mr-3 h-4 w-4" />
									{item.name}
								</Link>
							);
						})}
					</nav>

					{/* User info and logout */}
					<div className="border-t p-4">
						<div className="flex items-center space-x-3 mb-4">
							<div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
								{user?.name?.charAt(0).toUpperCase()}
							</div>
							<div>
								<p className="text-sm font-medium">
									{user?.name}
								</p>
								<p className="text-xs text-muted-foreground">
									Administrator
								</p>
							</div>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={logout}
							className="w-full"
						>
							<LogOut className="mr-2 h-4 w-4" />
							Logout
						</Button>
					</div>
				</div>
			</div>

			{/* Main content */}
			<div className="pl-64">
				<main className="py-8">
					<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	);
}
