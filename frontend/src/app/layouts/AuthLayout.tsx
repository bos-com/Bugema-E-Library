import { Outlet } from "react-router-dom";
import { BookOpen } from "lucide-react";

export default function AuthLayout() {
	return (
		<div className="min-h-screen bg-muted/50">
			<div className="container mx-auto px-4 py-8">
				<div className="flex items-center justify-center mb-8">
					<div className="flex items-center space-x-2">
						<BookOpen className="h-8 w-8 text-primary" />
						<span className="text-2xl font-bold">E-Library</span>
					</div>
				</div>
				<Outlet />
			</div>
		</div>
	);
}
