import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, Users, Star } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
import { useCategories } from "@/lib/api/catalog";

export default function HomePage() {
	const [searchQuery, setSearchQuery] = useState("");
	const navigate = useNavigate();
	const { data: categories, isLoading } = useCategories();

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			navigate(
				`/catalog?query=${encodeURIComponent(searchQuery.trim())}`
			);
		}
	};

	return (
		<div className="min-h-screen">
			{/* Hero Section */}
			<section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
				<div className="container mx-auto px-4">
					<div className="max-w-4xl mx-auto text-center">
						<h1 className="text-4xl md:text-6xl font-bold mb-6">
							Welcome to{" "}
							<span className="text-primary">E-Library</span>
						</h1>
						<p className="text-xl text-muted-foreground mb-8">
							Discover, read, and enjoy thousands of books from
							our digital collection. Your personal library is
							just a click away.
						</p>

						{/* Search Bar */}
						<form
							onSubmit={handleSearch}
							className="max-w-2xl mx-auto"
						>
							<div className="flex gap-2">
								<div className="relative flex-1">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
									<input
										type="text"
										placeholder="Search for books, authors, or topics..."
										value={searchQuery}
										onChange={(e) =>
											setSearchQuery(e.target.value)
										}
										className="w-full pl-10 pr-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
									/>
								</div>
								<Button type="submit" size="lg">
									Search
								</Button>
							</div>
						</form>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-16">
				<div className="container mx-auto px-4">
					<div className="grid md:grid-cols-3 gap-8">
						<Card>
							<CardHeader>
								<BookOpen className="h-8 w-8 text-primary mb-2" />
								<CardTitle>Read Online</CardTitle>
								<CardDescription>
									Access thousands of books instantly. No
									downloads required.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card>
							<CardHeader>
								<Users className="h-8 w-8 text-primary mb-2" />
								<CardTitle>Track Progress</CardTitle>
								<CardDescription>
									Keep track of your reading progress and
									continue where you left off.
								</CardDescription>
							</CardHeader>
						</Card>

						<Card>
							<CardHeader>
								<Star className="h-8 w-8 text-primary mb-2" />
								<CardTitle>Personal Library</CardTitle>
								<CardDescription>
									Like, bookmark, and organize your favorite
									books in one place.
								</CardDescription>
							</CardHeader>
						</Card>
					</div>
				</div>
			</section>

			{/* Categories Section */}
			<section className="py-16 bg-muted/50">
				<div className="container mx-auto px-4">
					<h2 className="text-3xl font-bold text-center mb-12">
						Browse Categories
					</h2>

					{isLoading ? (
						<div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
							{[...Array(8)].map((_, i) => (
								<Card key={i} className="animate-pulse">
									<CardContent className="p-6">
										<div className="h-4 bg-muted rounded mb-2"></div>
										<div className="h-3 bg-muted rounded w-2/3"></div>
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
							{categories?.slice(0, 8).map((category) => (
								<Card
									key={category.id}
									className="cursor-pointer hover:shadow-lg transition-shadow"
									onClick={() =>
										navigate(
											`/catalog?category=${category.slug}`
										)
									}
								>
									<CardContent className="p-6">
										<h3 className="font-semibold mb-2">
											{category.name}
										</h3>
										<p className="text-sm text-muted-foreground mb-2">
											{category.description}
										</p>
										<p className="text-xs text-primary">
											{category.book_count} books
										</p>
									</CardContent>
								</Card>
							))}
						</div>
					)}

					<div className="text-center mt-8">
						<Button
							variant="outline"
							onClick={() => navigate("/catalog")}
						>
							View All Categories
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}
