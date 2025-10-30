import { useState } from "react";
import {
	BarChart3,
	TrendingUp,
	Users,
	BookOpen,
	Eye,
	Heart,
} from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { AdminAnalytics } from "@/types";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function AdminAnalyticsPage() {
	const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

	const { data: analytics, isLoading } = useQuery({
		queryKey: ["admin", "analytics", timeRange],
		queryFn: async () => {
			const response = await apiClient.get<AdminAnalytics>(
				"/analytics/admin/overview/"
			);
			return response.data;
		},
	});

	if (isLoading) {
		return <LoadingSpinner size="lg" />;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Analytics Dashboard</h1>
					<p className="text-muted-foreground">
						Overview of your library's performance
					</p>
				</div>
				<div className="flex items-center space-x-2">
					<select
						value={timeRange}
						onChange={(e) => setTimeRange(e.target.value as any)}
						className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
					>
						<option value="7d">Last 7 days</option>
						<option value="30d">Last 30 days</option>
						<option value="90d">Last 90 days</option>
					</select>
				</div>
			</div>

			{/* Overview Stats */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<BookOpen className="h-8 w-8 text-primary" />
							<div className="ml-4">
								<p className="text-2xl font-bold">
									{analytics?.overview.total_books || 0}
								</p>
								<p className="text-sm text-muted-foreground">
									Total Books
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Users className="h-8 w-8 text-primary" />
							<div className="ml-4">
								<p className="text-2xl font-bold">
									{analytics?.overview.total_users || 0}
								</p>
								<p className="text-sm text-muted-foreground">
									Total Users
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Eye className="h-8 w-8 text-primary" />
							<div className="ml-4">
								<p className="text-2xl font-bold">
									{analytics?.overview.total_reads || 0}
								</p>
								<p className="text-sm text-muted-foreground">
									Total Reads
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
									{analytics?.overview.active_users_7d || 0}
								</p>
								<p className="text-sm text-muted-foreground">
									Active Users (7d)
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Most Read Books */}
				<Card>
					<CardHeader>
						<CardTitle>Most Read Books</CardTitle>
						<CardDescription>
							Top books by view count
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{analytics?.most_read_books
								.slice(0, 5)
								.map((book, index) => (
									<div
										key={book.id}
										className="flex items-center justify-between"
									>
										<div className="flex items-center space-x-3">
											<div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
												{index + 1}
											</div>
											<div>
												<p className="font-medium">
													{book.title}
												</p>
												<p className="text-sm text-muted-foreground">
													{book.author}
												</p>
											</div>
										</div>
										<div className="text-right">
											<p className="font-medium">
												{book.view_count}
											</p>
											<p className="text-sm text-muted-foreground">
												views
											</p>
										</div>
									</div>
								))}
						</div>
					</CardContent>
				</Card>

				{/* Most Liked Categories */}
				<Card>
					<CardHeader>
						<CardTitle>Most Liked Categories</CardTitle>
						<CardDescription>
							Popular categories by likes
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{analytics?.most_liked_categories
								.slice(0, 5)
								.map((category, index) => (
									<div
										key={category.name}
										className="flex items-center justify-between"
									>
										<div className="flex items-center space-x-3">
											<div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
												{index + 1}
											</div>
											<div>
												<p className="font-medium">
													{category.name}
												</p>
											</div>
										</div>
										<div className="text-right">
											<p className="font-medium">
												{category.likes}
											</p>
											<p className="text-sm text-muted-foreground">
												likes
											</p>
										</div>
									</div>
								))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Reading Activity Chart */}
			<Card>
				<CardHeader>
					<CardTitle>Reading Activity</CardTitle>
					<CardDescription>
						Daily reading activity over time
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-64 flex items-center justify-center text-muted-foreground">
						<div className="text-center">
							<BarChart3 className="h-12 w-12 mx-auto mb-4" />
							<p>
								Reading activity chart would be implemented here
							</p>
							<p className="text-sm">
								Using a charting library like Recharts
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Top Search Terms */}
			<Card>
				<CardHeader>
					<CardTitle>Top Search Terms</CardTitle>
					<CardDescription>
						Most searched terms by users
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						{analytics?.top_search_terms.map((term, index) => (
							<div
								key={term.term}
								className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-full"
							>
								<span className="text-sm font-medium">
									#{index + 1}
								</span>
								<span className="text-sm">{term.term}</span>
								<span className="text-xs text-muted-foreground">
									({term.count})
								</span>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
