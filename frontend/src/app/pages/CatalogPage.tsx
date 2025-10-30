import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, Grid, List } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
import { useBooks, useCategories } from "@/lib/api/catalog";
import { Book } from "@/types";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function CatalogPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [showFilters, setShowFilters] = useState(false);

	const query = searchParams.get("query") || "";
	const category = searchParams.get("category") || "";
	const page = parseInt(searchParams.get("page") || "1");

	const { data: booksData, isLoading: booksLoading } = useBooks({
		query,
		category,
		page,
		limit: 20,
	});

	const { data: categories, isLoading: categoriesLoading } = useCategories();

	const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const searchQuery = formData.get("search") as string;
		if (searchQuery.trim()) {
			setSearchParams({ query: searchQuery.trim() });
		} else {
			setSearchParams({});
		}
	};

	const handleCategoryFilter = (categorySlug: string) => {
		if (categorySlug === category) {
			setSearchParams({ query });
		} else {
			setSearchParams({ query, category: categorySlug });
		}
	};

	const BookCard = ({ book }: { book: Book }) => (
		<Card className="cursor-pointer hover:shadow-lg transition-shadow">
			<div className="aspect-[3/4] bg-muted rounded-t-lg flex items-center justify-center">
				{book.cover_image ? (
					<img
						src={`/api/catalog/books/${book.id}/cover/`}
						alt={book.title}
						className="w-full h-full object-cover rounded-t-lg"
					/>
				) : (
					<div className="text-muted-foreground text-center">
						<div className="text-4xl mb-2">📚</div>
						<div className="text-sm">No Cover</div>
					</div>
				)}
			</div>
			<CardContent className="p-4">
				<h3 className="font-semibold mb-2 line-clamp-2">
					{book.title}
				</h3>
				<p className="text-sm text-muted-foreground mb-2">
					{book.author}
				</p>
				<div className="flex flex-wrap gap-1 mb-2">
					{book.categories.slice(0, 2).map((cat) => (
						<span
							key={cat.id}
							className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
						>
							{cat.name}
						</span>
					))}
				</div>
				<div className="flex items-center justify-between text-sm text-muted-foreground">
					<span>{book.year}</span>
					<span>{book.pages} pages</span>
				</div>
			</CardContent>
		</Card>
	);

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="flex flex-col lg:flex-row gap-8">
				{/* Filters Sidebar */}
				<div className="lg:w-64">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Filter className="h-4 w-4" />
								Filters
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Search */}
							<form onSubmit={handleSearch}>
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
									<input
										name="search"
										type="text"
										placeholder="Search books..."
										defaultValue={query}
										className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
									/>
								</div>
							</form>

							{/* Categories */}
							<div>
								<h4 className="font-medium mb-2">Categories</h4>
								<div className="space-y-2">
									<button
										onClick={() => handleCategoryFilter("")}
										className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
											!category
												? "bg-primary text-primary-foreground"
												: "hover:bg-muted"
										}`}
									>
										All Categories
									</button>
									{categoriesLoading ? (
										<div className="space-y-2">
											{[...Array(5)].map((_, i) => (
												<div
													key={i}
													className="h-8 bg-muted rounded animate-pulse"
												/>
											))}
										</div>
									) : (
										categories?.map((cat) => (
											<button
												key={cat.id}
												onClick={() =>
													handleCategoryFilter(
														cat.slug
													)
												}
												className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
													category === cat.slug
														? "bg-primary text-primary-foreground"
														: "hover:bg-muted"
												}`}
											>
												{cat.name} ({cat.book_count})
											</button>
										))
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Main Content */}
				<div className="flex-1">
					{/* Header */}
					<div className="flex items-center justify-between mb-6">
						<div>
							<h1 className="text-2xl font-bold">
								{query
									? `Search results for "${query}"`
									: "All Books"}
							</h1>
							{booksData && (
								<p className="text-muted-foreground">
									{booksData.count} books found
								</p>
							)}
						</div>
						<div className="flex items-center gap-2">
							<Button
								variant={
									viewMode === "grid" ? "default" : "outline"
								}
								size="sm"
								onClick={() => setViewMode("grid")}
							>
								<Grid className="h-4 w-4" />
							</Button>
							<Button
								variant={
									viewMode === "list" ? "default" : "outline"
								}
								size="sm"
								onClick={() => setViewMode("list")}
							>
								<List className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* Books Grid/List */}
					{booksLoading ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
							{[...Array(8)].map((_, i) => (
								<Card key={i} className="animate-pulse">
									<div className="aspect-[3/4] bg-muted rounded-t-lg" />
									<CardContent className="p-4">
										<div className="h-4 bg-muted rounded mb-2" />
										<div className="h-3 bg-muted rounded w-2/3 mb-2" />
										<div className="h-3 bg-muted rounded w-1/3" />
									</CardContent>
								</Card>
							))}
						</div>
					) : booksData?.results.length ? (
						<div
							className={
								viewMode === "grid"
									? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
									: "space-y-4"
							}
						>
							{booksData.results.map((book) => (
								<BookCard key={book.id} book={book} />
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<div className="text-6xl mb-4">📚</div>
							<h3 className="text-xl font-semibold mb-2">
								No books found
							</h3>
							<p className="text-muted-foreground">
								Try adjusting your search or filter criteria
							</p>
						</div>
					)}

					{/* Pagination */}
					{booksData && booksData.count > 20 && (
						<div className="flex justify-center mt-8">
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									disabled={!booksData.previous}
									onClick={() => {
										const prevPage = page - 1;
										setSearchParams({
											...Object.fromEntries(searchParams),
											page: prevPage.toString(),
										});
									}}
								>
									Previous
								</Button>
								<span className="px-4 py-2 text-sm text-muted-foreground">
									Page {page} of{" "}
									{Math.ceil(booksData.count / 20)}
								</span>
								<Button
									variant="outline"
									disabled={!booksData.next}
									onClick={() => {
										const nextPage = page + 1;
										setSearchParams({
											...Object.fromEntries(searchParams),
											page: nextPage.toString(),
										});
									}}
								>
									Next
								</Button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
