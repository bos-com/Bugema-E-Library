import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
import { useRegister } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/auth";
import toast from "react-hot-toast";

const registerSchema = z
	.object({
		name: z.string().min(2, "Name must be at least 2 characters"),
		email: z.string().email("Invalid email address"),
		password: z.string().min(6, "Password must be at least 6 characters"),
		password_confirm: z.string(),
	})
	.refine((data) => data.password === data.password_confirm, {
		message: "Passwords don't match",
		path: ["password_confirm"],
	});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
	const [showPassword, setShowPassword] = useState(false);
	const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
	const navigate = useNavigate();
	const { setUser, setTokens } = useAuthStore();

	const registerMutation = useRegister();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
	});

	const onSubmit = async (data: RegisterFormData) => {
		try {
			const response = await registerMutation.mutateAsync(data);
			setUser(response.user);
			setTokens(response.tokens);
			toast.success("Registration successful!");
			navigate("/dashboard");
		} catch (error: any) {
			toast.error(error.response?.data?.error || "Registration failed");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-muted/50 py-12 px-4 sm:px-6 lg:px-8">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl text-center">
						Create account
					</CardTitle>
					<CardDescription className="text-center">
						Enter your information to create your account
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-4"
					>
						<div className="space-y-2">
							<label
								htmlFor="name"
								className="text-sm font-medium"
							>
								Full Name
							</label>
							<input
								id="name"
								type="text"
								{...register("name")}
								className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
								placeholder="Enter your full name"
							/>
							{errors.name && (
								<p className="text-sm text-destructive">
									{errors.name.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<label
								htmlFor="email"
								className="text-sm font-medium"
							>
								Email
							</label>
							<input
								id="email"
								type="email"
								{...register("email")}
								className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
								placeholder="Enter your email"
							/>
							{errors.email && (
								<p className="text-sm text-destructive">
									{errors.email.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<label
								htmlFor="password"
								className="text-sm font-medium"
							>
								Password
							</label>
							<div className="relative">
								<input
									id="password"
									type={showPassword ? "text" : "password"}
									{...register("password")}
									className="w-full px-3 py-2 pr-10 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
									placeholder="Enter your password"
								/>
								<button
									type="button"
									onClick={() =>
										setShowPassword(!showPassword)
									}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
							{errors.password && (
								<p className="text-sm text-destructive">
									{errors.password.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<label
								htmlFor="password_confirm"
								className="text-sm font-medium"
							>
								Confirm Password
							</label>
							<div className="relative">
								<input
									id="password_confirm"
									type={
										showPasswordConfirm
											? "text"
											: "password"
									}
									{...register("password_confirm")}
									className="w-full px-3 py-2 pr-10 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
									placeholder="Confirm your password"
								/>
								<button
									type="button"
									onClick={() =>
										setShowPasswordConfirm(
											!showPasswordConfirm
										)
									}
									className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									{showPasswordConfirm ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
							{errors.password_confirm && (
								<p className="text-sm text-destructive">
									{errors.password_confirm.message}
								</p>
							)}
						</div>

						<Button
							type="submit"
							className="w-full"
							disabled={registerMutation.isPending}
						>
							{registerMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating account...
								</>
							) : (
								"Create account"
							)}
						</Button>
					</form>

					<div className="mt-6 text-center">
						<p className="text-sm text-muted-foreground">
							Already have an account?{" "}
							<Link
								to="/auth/login"
								className="text-primary hover:underline"
							>
								Sign in
							</Link>
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
