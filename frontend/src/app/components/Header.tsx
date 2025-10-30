import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
	Search,
	Menu,
	X,
	User,
	LogOut,
	BookOpen,
	Settings,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useAuthStore } from "@/lib/store/auth";

export default function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const { user, isAuthenticated, logout } = useAuthStore();
	const navigate = useNavigate();

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			navigate(
				`/catalog?query=${encodeURIComponent(searchQuery.trim())}`
			);
		}
	};

	const handleLogout = () => {
		logout();
		navigate("/");
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<Link to="/" className="flex items-center space-x-2">
						<BookOpen className="h-6 w-6 text-primary" />
						<span className="text-xl font-bold">E-Library</span>
					</Link>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex items-center space-x-6">
						<Link
							to="/catalog"
							className="text-sm font-medium hover:text-primary transition-colors"
						>
							Catalog
						</Link>
						{isAuthenticated && (
							<Link
								to="/dashboard"
								className="text-sm font-medium hover:text-primary transition-colors"
							>
								Dashboard
							</Link>
						)}
						{isAuthenticated && user?.role === "ADMIN" && (
							<Link
								to="/admin"
								className="text-sm font-medium hover:text-primary transition-colors"
							>
								Admin
							</Link>
						)}
					</nav>

					{/* Search Bar */}
					<form
						onSubmit={handleSearch}
						className="hidden lg:flex flex-1 max-w-sm mx-8"
					>
						<div className="relative w-full">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
							<input
								type="text"
								placeholder="Search books..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
							/>
						</div>
					</form>

					{/* User Menu */}
					<div className="flex items-center space-x-4">
						{isAuthenticated ? (
							<div className="flex items-center space-x-2">
								<span className="text-sm text-muted-foreground">
									Welcome, {user?.name}
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={handleLogout}
								>
									<LogOut className="h-4 w-4" />
								</Button>
							</div>
						) : (
							<div className="flex items-center space-x-2">
								<Button variant="ghost" asChild>
									<Link to="/auth/login">Login</Link>
								</Button>
								<Button asChild>
									<Link to="/auth/register">Sign Up</Link>
								</Button>
							</div>
						)}

						{/* Mobile Menu Button */}
						<Button
							variant="ghost"
							size="sm"
							className="md:hidden"
							onClick={() => setIsMenuOpen(!isMenuOpen)}
						>
							{isMenuOpen ? (
								<X className="h-4 w-4" />
							) : (
								<Menu className="h-4 w-4" />
							)}
						</Button>
					</div>
				</div>

				{/* Mobile Menu */}
				{isMenuOpen && (
					<div className="md:hidden border-t py-4">
						<nav className="flex flex-col space-y-4">
							<Link
								to="/catalog"
								className="text-sm font-medium hover:text-primary transition-colors"
								onClick={() => setIsMenuOpen(false)}
							>
								Catalog
							</Link>
							{isAuthenticated && (
								<Link
									to="/dashboard"
									className="text-sm font-medium hover:text-primary transition-colors"
									onClick={() => setIsMenuOpen(false)}
								>
									Dashboard
								</Link>
							)}
							{isAuthenticated && user?.role === "ADMIN" && (
								<Link
									to="/admin"
									className="text-sm font-medium hover:text-primary transition-colors"
									onClick={() => setIsMenuOpen(false)}
								>
									Admin
								</Link>
							)}

							{/* Mobile Search */}
							<form onSubmit={handleSearch} className="pt-4">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
									<input
										type="text"
										placeholder="Search books..."
										value={searchQuery}
										onChange={(e) =>
											setSearchQuery(e.target.value)
										}
										className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
									/>
								</div>
							</form>
						</nav>
					</div>
				)}
			</div>
		</header>
	);
}
