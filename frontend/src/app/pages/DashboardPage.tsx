import { useState } from "react";
import { Link } from "react-router-dom";
import {
	BookOpen,
	Heart,
	Bookmark,
	Clock,
	TrendingUp,
	Calendar,
	Target,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
import { useDashboard, useReadingStats } from "@/lib/api/reading";
import {
	formatTime,
	formatDate,
	getProgressColor,
	getProgressBarColor,
} from "@/lib/utils";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function DashboardPage() {
	const [activeTab, setActiveTab] = useState<
		"progress" | "completed" | "liked" | "bookmarks" | "stats"
	>("progress");

	const { data: dashboard, isLoading: dashboardLoading } = useDashboard();
	const { data: stats, isLoading: statsLoading } = useReadingStats();

	if (dashboardLoading || statsLoading) {
		return <LoadingSpinner size="lg" />;
	}

	const tabs = [
		{
			id: "progress",
			label: "In Progress",
			count: dashboard?.in_progress.length || 0,
		},
		{
			id: "completed",
			label: "Completed",
			count: dashboard?.completed.length || 0,
		},
		{
			id: "liked",
			label: "Liked",
			count: dashboard?.liked_books.length || 0,
		},
		{
			id: "bookmarks",
			label: "Bookmarks",
			count: dashboard?.bookmarked_books.length || 0,
		},
		{ id: "stats", label: "Statistics", count: null },
	];

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
				<p className="text-muted-foreground">
					Track your reading progress and manage your library
				</p>
			</div>

			{/* Stats Overview */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<BookOpen className="h-8 w-8 text-primary" />
							<div className="ml-4">
								<p className="text-2xl font-bold">
									{stats?.total_books_read || 0}
								</p>
								<p className="text-sm text-muted-foreground">
									Books Read
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Clock className="h-8 w-8 text-primary" />
							<div className="ml-4">
								<p className="text-2xl font-bold">
									{formatTime(stats?.total_time_seconds || 0)}
								</p>
								<p className="text-sm text-muted-foreground">
									Time Read
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<TrendingUp className="h-8 w-8 text-primary" />
							<div className="ml-4">
								<p className="text-2xl font-bold">
									{stats?.current_streak_days || 0}
								</p>
								<p className="text-sm text-muted-foreground">
									Day Streak
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Target className="h-8 w-8 text-primary" />
							<div className="ml-4">
								<p className="text-2xl font-bold">
									{Math.round(
										stats?.reading_goal_progress || 0
									)}
									%
								</p>
								<p className="text-sm text-muted-foreground">
									Goal Progress
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<div className="flex flex-wrap gap-2 mb-6">
				{tabs.map((tab) => (
					<Button
						key={tab.id}
						variant={activeTab === tab.id ? "default" : "outline"}
						onClick={() => setActiveTab(tab.id as any)}
						className="flex items-center gap-2"
					>
						{tab.label}
						{tab.count !== null && (
							<span className="bg-background/20 text-xs px-2 py-1 rounded-full">
								{tab.count}
							</span>
						)}
					</Button>
				))}
			</div>

			{/* Tab Content */}
			<div className="space-y-6">
				{activeTab === "progress" && (
					<div>
						<h2 className="text-2xl font-bold mb-4">
							Currently Reading
						</h2>
						{dashboard?.in_progress.length ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{dashboard.in_progress.map((book) => (
									<Card
										key={book.id}
										className="cursor-pointer hover:shadow-lg transition-shadow"
									>
										<div className="aspect-[3/4] bg-muted rounded-t-lg flex items-center justify-center">
											{book.book_cover ? (
												<img
													src={`/api/catalog/books/${book.book}/cover/`}
													alt={book.book_title}
													className="w-full h-full object-cover rounded-t-lg"
												/>
											) : (
												<div className="text-muted-foreground text-center">
													<div className="text-4xl mb-2">
														📚
													</div>
													<div className="text-sm">
														No Cover
													</div>
												</div>
											)}
										</div>
										<CardContent className="p-4">
											<h3 className="font-semibold mb-2 line-clamp-2">
												{book.book_title}
											</h3>
											<p className="text-sm text-muted-foreground mb-3">
												{book.book_author}
											</p>

											<div className="space-y-2">
												<div className="flex justify-between text-sm">
													<span>Progress</span>
													<span
														className={getProgressColor(
															book.percent
														)}
													>
														{Math.round(
															book.percent
														)}
														%
													</span>
												</div>
												<div className="w-full bg-muted rounded-full h-2">
													<div
														className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(
															book.percent
														)}`}
														style={{
															width: `${book.percent}%`,
														}}
													/>
												</div>
												<p className="text-xs text-muted-foreground">
													Last read:{" "}
													{formatDate(
														book.last_opened_at
													)}
												</p>
											</div>

											<Button
												asChild
												className="w-full mt-4"
											>
												<Link
													to={`/book/${book.book}/read`}
												>
													Continue Reading
												</Link>
											</Button>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<div className="text-center py-12">
								<BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-xl font-semibold mb-2">
									No books in progress
								</h3>
								<p className="text-muted-foreground mb-4">
									Start reading a book to see it here
								</p>
								<Button asChild>
									<Link to="/catalog">Browse Catalog</Link>
								</Button>
							</div>
						)}
					</div>
				)}

				{activeTab === "completed" && (
					<div>
						<h2 className="text-2xl font-bold mb-4">
							Completed Books
						</h2>
						{dashboard?.completed.length ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{dashboard.completed.map((book) => (
									<Card
										key={book.id}
										className="cursor-pointer hover:shadow-lg transition-shadow"
									>
										<div className="aspect-[3/4] bg-muted rounded-t-lg flex items-center justify-center">
											{book.book_cover ? (
												<img
													src={`/api/catalog/books/${book.book}/cover/`}
													alt={book.book_title}
													className="w-full h-full object-cover rounded-t-lg"
												/>
											) : (
												<div className="text-muted-foreground text-center">
													<div className="text-4xl mb-2">
														📚
													</div>
													<div className="text-sm">
														No Cover
													</div>
												</div>
											)}
										</div>
										<CardContent className="p-4">
											<h3 className="font-semibold mb-2 line-clamp-2">
												{book.book_title}
											</h3>
											<p className="text-sm text-muted-foreground mb-3">
												{book.book_author}
											</p>
											<p className="text-xs text-muted-foreground">
												Completed:{" "}
												{formatDate(book.updated_at)}
											</p>
											<Button
												asChild
												variant="outline"
												className="w-full mt-4"
											>
												<Link to={`/book/${book.book}`}>
													View Details
												</Link>
											</Button>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<div className="text-center py-12">
								<BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-xl font-semibold mb-2">
									No completed books
								</h3>
								<p className="text-muted-foreground mb-4">
									Finish reading a book to see it here
								</p>
								<Button asChild>
									<Link to="/catalog">Browse Catalog</Link>
								</Button>
							</div>
						)}
					</div>
				)}

				{activeTab === "liked" && (
					<div>
						<h2 className="text-2xl font-bold mb-4">Liked Books</h2>
						{dashboard?.liked_books.length ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{dashboard.liked_books.map((book) => (
									<Card
										key={book.id}
										className="cursor-pointer hover:shadow-lg transition-shadow"
									>
										<div className="aspect-[3/4] bg-muted rounded-t-lg flex items-center justify-center">
											{book.cover_image ? (
												<img
													src={`/api/catalog/books/${book.id}/cover/`}
													alt={book.title}
													className="w-full h-full object-cover rounded-t-lg"
												/>
											) : (
												<div className="text-muted-foreground text-center">
													<div className="text-4xl mb-2">
														📚
													</div>
													<div className="text-sm">
														No Cover
													</div>
												</div>
											)}
										</div>
										<CardContent className="p-4">
											<h3 className="font-semibold mb-2 line-clamp-2">
												{book.title}
											</h3>
											<p className="text-sm text-muted-foreground mb-3">
												{book.author}
											</p>
											<Button
												asChild
												className="w-full mt-4"
											>
												<Link to={`/book/${book.id}`}>
													View Details
												</Link>
											</Button>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<div className="text-center py-12">
								<Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-xl font-semibold mb-2">
									No liked books
								</h3>
								<p className="text-muted-foreground mb-4">
									Like books to see them here
								</p>
								<Button asChild>
									<Link to="/catalog">Browse Catalog</Link>
								</Button>
							</div>
						)}
					</div>
				)}

				{activeTab === "bookmarks" && (
					<div>
						<h2 className="text-2xl font-bold mb-4">
							Bookmarked Books
						</h2>
						{dashboard?.bookmarked_books.length ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{dashboard.bookmarked_books.map((book) => (
									<Card
										key={book.id}
										className="cursor-pointer hover:shadow-lg transition-shadow"
									>
										<div className="aspect-[3/4] bg-muted rounded-t-lg flex items-center justify-center">
											{book.cover_image ? (
												<img
													src={`/api/catalog/books/${book.id}/cover/`}
													alt={book.title}
													className="w-full h-full object-cover rounded-t-lg"
												/>
											) : (
												<div className="text-muted-foreground text-center">
													<div className="text-4xl mb-2">
														📚
													</div>
													<div className="text-sm">
														No Cover
													</div>
												</div>
											)}
										</div>
										<CardContent className="p-4">
											<h3 className="font-semibold mb-2 line-clamp-2">
												{book.title}
											</h3>
											<p className="text-sm text-muted-foreground mb-3">
												{book.author}
											</p>
											<p className="text-xs text-muted-foreground mb-3">
												Bookmarked at: {book.location}
											</p>
											<Button
												asChild
												className="w-full mt-4"
											>
												<Link to={`/book/${book.id}`}>
													View Details
												</Link>
											</Button>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<div className="text-center py-12">
								<Bookmark className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-xl font-semibold mb-2">
									No bookmarked books
								</h3>
								<p className="text-muted-foreground mb-4">
									Bookmark books to see them here
								</p>
								<Button asChild>
									<Link to="/catalog">Browse Catalog</Link>
								</Button>
							</div>
						)}
					</div>
				)}

				{activeTab === "stats" && (
					<div className="space-y-6">
						<h2 className="text-2xl font-bold">
							Reading Statistics
						</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<Card>
								<CardHeader>
									<CardTitle>Reading Goal</CardTitle>
									<CardDescription>
										Your progress towards this year's
										reading goal
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-2">
										<div className="flex justify-between text-sm">
											<span>Progress</span>
											<span>
												{Math.round(
													stats?.reading_goal_progress ||
														0
												)}
												%
											</span>
										</div>
										<div className="w-full bg-muted rounded-full h-2">
											<div
												className="bg-primary h-2 rounded-full transition-all duration-300"
												style={{
													width: `${
														stats?.reading_goal_progress ||
														0
													}%`,
												}}
											/>
										</div>
										<p className="text-sm text-muted-foreground">
											{stats?.books_read_this_year || 0}{" "}
											books read this year
										</p>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Reading Time</CardTitle>
									<CardDescription>
										Time spent reading this month
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold text-primary">
										{formatTime(
											stats?.total_time_this_month_seconds ||
												0
										)}
									</div>
									<p className="text-sm text-muted-foreground mt-2">
										Total reading time this month
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Current Streak</CardTitle>
									<CardDescription>
										Days of consecutive reading
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold text-primary">
										{stats?.current_streak_days || 0}
									</div>
									<p className="text-sm text-muted-foreground mt-2">
										Days in a row
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Favorite Category</CardTitle>
									<CardDescription>
										Your most read category
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="text-3xl font-bold text-primary">
										{stats?.favorite_categories?.[0]
											?.name || "None"}
									</div>
									<p className="text-sm text-muted-foreground mt-2">
										{stats?.favorite_categories?.[0]
											?.count || 0}{" "}
										books read
									</p>
								</CardContent>
							</Card>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
