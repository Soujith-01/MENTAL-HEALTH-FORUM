
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate, NavLink } from "react-router";
import { useState } from "react";
import {
  pageBackground,
  formCard,
  formTitle,
  formGroup,
  labelClass,
  inputClass,
  submitBtn,
  errorClass,
  mutedText,
  linkClass,
} from "../styles/common";

const avatarOptions = [
  "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=BlueCircle",
  "https://api.dicebear.com/9.x/big-ears/svg?seed=CalmFace",
  "https://api.dicebear.com/9.x/avataaars/svg?seed=SoftSmile",
  "https://api.dicebear.com/9.x/fun-emoji/svg?seed=NeonMood",
];

function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0]);

  const onSubmit = async (formData) => {
    setApiError("");

    try {
      const res = await axios.post(
        "http://localhost:3000/common-api/users",
        { ...formData, avatar: selectedAvatar },
        {
        withCredentials: true,
        }
      );

      toast.success(res.data?.message || "Account created");
      navigate("/login");
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      setApiError(message);
      toast.error(message);
    }
  };

  return (
    <div className={`${pageBackground} flex items-center justify-center py-16 px-4`}>
      <div className={formCard}>
        <h2 className={formTitle}>Create Account</h2>

        {apiError && <p className={errorClass}>{apiError}</p>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={formGroup}>
            <label className={labelClass}>Username</label>
            <input
              type="text"
              placeholder="Your username"
              className={inputClass}
              {...register("username", {
                required: "Username is required",
                minLength: { value: 4, message: "Username must be at least 4 characters" },
              })}
            />
            {errors.username && <p className={errorClass}>{errors.username.message}</p>}
          </div>

          <div className={formGroup}>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className={inputClass}
              {...register("email", {
                required: "Email is required",
              })}
            />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>

          <div className={formGroup}>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className={inputClass}
              {...register("password", {
                required: "Password is required",
                minLength: { value: 4, message: "Password must be at least 4 characters" },
              })}
            />
            {errors.password && <p className={errorClass}>{errors.password.message}</p>}
          </div>

          <div className={formGroup}>
            <label className={labelClass}>Choose Avatar</label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {avatarOptions.map((avatarUrl) => (
                <button
                  key={avatarUrl}
                  type="button"
                  onClick={() => setSelectedAvatar(avatarUrl)}
                  className={`rounded-3xl border p-3 transition-all duration-300 ${
                    selectedAvatar === avatarUrl
                      ? "border-[#11A8E8] bg-[#0b1720]"
                      : "border-[#1f1f1f] bg-[#0d0d0d] hover:border-[#11A8E8]/40"
                  }`}
                >
                  <img
                    src={avatarUrl}
                    alt="Avatar option"
                    className="h-20 w-20 rounded-full object-cover border border-[#1f1f1f] mx-auto"
                  />
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className={submitBtn}>
            Register
          </button>
        </form>

        <p className={`${mutedText} text-center mt-5`}>
          Already have an account?{" "}
          <NavLink to="/login" className={linkClass}>
            Sign in
          </NavLink>
        </p>
      </div>
    </div>
  );
}

export default Register;