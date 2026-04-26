"use client";

import { motion } from "framer-motion";
import { Sun, Moon, Cloud, Sunrise, Sunset } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardGreeting({ user, branchInfo }) {
  const [greeting, setGreeting] = useState("");
  const [icon, setIcon] = useState(Sun);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();

      if (hour >= 5 && hour < 12) {
        setGreeting("Good Morning");
        setIcon(hour < 7 ? Sunrise : Sun);
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good Afternoon");
        setIcon(Sun);
      } else if (hour >= 17 && hour < 20) {
        setGreeting("Good Evening");
        setIcon(Sunset);
      } else {
        setGreeting("Good Night");
        setIcon(Moon);
      }
    };

    updateGreeting();
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      updateGreeting();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const GreetingIcon = icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="flex items-center gap-3 mb-2">
        <motion.div
          animate={{
            rotate: icon === Sun ? 360 : 0,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity },
          }}
        >
          <GreetingIcon className="w-8 h-8 text-primary" />
        </motion.div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {greeting}, {user?.fullName || "Teacher"}!
          </h1>
          <p className="text-muted-foreground">
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {branchInfo?.branchName && ` • ${branchInfo.branchName}`}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
