"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    const adminStr = localStorage.getItem("admin");
    if (adminStr) {
      const adminObj = JSON.parse(adminStr);
      setAdminId(adminObj.id);
    }
  }, []);

  const fetchNotifications = async () => {
    if (!adminId) return;
    try {
      const res = await fetch(`/api/notificaciones?adminId=${adminId}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("Error fetching notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [adminId]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0 && adminId) {
      try {
        await fetch("/api/notificaciones", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminId })
        });
        // Optimistically update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      } catch (e) {
        console.error("Error marking as read", e);
      }
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleOpen}
        className="relative p-2 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
      >
        <span className="material-symbols-outlined">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-card-dark border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-sm">Notificaciones</h3>
              <span className="text-xs text-slate-500">{notifications.length} recientes</span>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-2">
              {notifications.length === 0 ? (
                <div className="text-center p-4 text-sm text-slate-500">
                  No tienes notificaciones
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`p-3 rounded-lg text-sm ${n.isRead ? 'bg-transparent' : 'bg-primary/5 border border-primary/20'}`}>
                    <p className="text-slate-800 dark:text-slate-200">{n.message}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {format(new Date(n.createdAt), "dd/MM HH:mm", { locale: es })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
