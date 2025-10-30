import { useState } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
import { useBooks } from "@/lib/api/catalog";

export default function AdminBooksPage() {
	const [searchQuery, setSearchQuery] = useState("");
	const [currentPage, setCurrentPage] = useState(1);

	const { data: booksData, isLoading } = useBooks({
		query: searchQuery,
		page: currentPage,
		limit: 20,
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Books Management</h1>
					<p className="text-muted-foreground">
						Manage your library's book collection
					</p>
				</div>
				<Button>
					<Plus className="h-4 w-4 mr-2" />
					Add Book
				</Button>
			</div>

			{/* Search and Filters */}
			<Card>
				<CardHeader>
					<CardTitle>Search & Filter</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4">
						<div className="flex-1">
							<input
								type="text"
								placeholder="Search books..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
							/>
						</div>
						<Button variant="outline">Filter</Button>
					</div>
				</CardContent>
			</Card>

			{/* Books Table */}
			<Card>
				<CardHeader>
					<CardTitle>Books ({booksData?.count || 0})</CardTitle>
					<CardDescription>
						Manage your book collection
					</CardDescription>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="space-y-4">
							{[...Array(5)].map((_, i) => (
								<div
									key={i}
									className="h-16 bg-muted rounded animate-pulse"
								/>
							))}
						</div>
					) : booksData?.results.length ? (
						<div className="space-y-4">
							{booksData.results.map((book) => (
								<div
									key={book.id}
									className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
								>
									<div className="flex items-center space-x-4">
										<div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
											{book.cover_image ? (
												<img
													src={`/api/catalog/books/${book.id}/cover/`}
													alt={book.title}
													className="w-full h-full object-cover rounded"
												/>
											) : (
												<span className="text-2xl">
													📚
												</span>
											)}
										</div>
										<div>
											<h3 className="font-semibold">
												{book.title}
											</h3>
											<p className="text-sm text-muted-foreground">
												{book.author}
											</p>
											<div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
												<span>{book.year}</span>
												<span>{book.pages} pages</span>
												<span>{book.file_type}</span>
												<span
													className={`px-2 py-1 rounded ${
														book.is_published
															? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
															: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
													}`}
												>
													{book.is_published
														? "Published"
														: "Draft"}
												</span>
											</div>
										</div>
									</div>

									<div className="flex items-center space-x-2">
										<Button variant="outline" size="sm">
											<Eye className="h-4 w-4" />
										</Button>
										<Button variant="outline" size="sm">
											<Edit className="h-4 w-4" />
										</Button>
										<Button variant="outline" size="sm">
											{book.is_published ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</Button>
										<Button
											variant="outline"
											size="sm"
											className="text-destructive hover:text-destructive"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-12">
							<div className="text-6xl mb-4">📚</div>
							<h3 className="text-xl font-semibold mb-2">
								No books found
							</h3>
							<p className="text-muted-foreground mb-4">
								{searchQuery
									? "Try adjusting your search criteria"
									: "Get started by adding your first book"}
							</p>
							<Button>
								<Plus className="h-4 w-4 mr-2" />
								Add Book
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Pagination */}
			{booksData && booksData.count > 20 && (
				<div className="flex justify-center">
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							disabled={!booksData.previous}
							onClick={() => setCurrentPage(currentPage - 1)}
						>
							Previous
						</Button>
						<span className="px-4 py-2 text-sm text-muted-foreground">
							Page {currentPage} of{" "}
							{Math.ceil(booksData.count / 20)}
						</span>
						<Button
							variant="outline"
							disabled={!booksData.next}
							onClick={() => setCurrentPage(currentPage + 1)}
						>
							Next
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
