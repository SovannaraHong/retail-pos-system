"use client";

import { useEffect, useState } from "react";
import { ProductService } from "@/services/product-service";
import type { Product } from "@/types/product";

export interface SystemNotification {
  id: string;
  type: "low_stock" | "sale" | "shift";
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
}

let cachedNotifications: SystemNotification[] = [];
const listeners = new Set<(items: SystemNotification[]) => void>();

export function useNotifications() {
  const [notifications, setNotifications] = useState<SystemNotification[]>(cachedNotifications);
  const [loading, setLoading] = useState(false);

  const fetchLowStockNotifications = async () => {
    try {
      setLoading(true);
      const res = await ProductService.getAll({ low_stock: true, per_page: 20 });
      const products: Product[] = res.data || [];

      const lowStockNotifs: SystemNotification[] = products.map((p) => ({
        id: `low-stock-${p.id}`,
        type: "low_stock",
        title: "Low Stock Alert",
        message: `${p.name} is running low (${p.stock_qty} left, reorder level ${p.reorder_level || 10})`,
        time: "Action needed",
        read: false,
        link: "/products",
      }));

      // Merge with custom announcements if empty
      const list: SystemNotification[] = lowStockNotifs.length > 0
        ? lowStockNotifs
        : [
            {
              id: "welcome-system",
              type: "shift",
              title: "System Active",
              message: "All inventory items are currently well-stocked.",
              time: "Just now",
              read: true,
            },
          ];

      cachedNotifications = list;
      setNotifications(list);
      listeners.forEach((fn) => fn(list));
    } catch {
      // Ignore if user lacks permission
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cachedNotifications.length === 0) {
      fetchLowStockNotifications();
    } else {
      setNotifications(cachedNotifications);
    }

    const listener = (newNotifs: SystemNotification[]) => setNotifications(newNotifs);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    cachedNotifications = updated;
    setNotifications(updated);
    listeners.forEach((fn) => fn(updated));
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    cachedNotifications = updated;
    setNotifications(updated);
    listeners.forEach((fn) => fn(updated));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    refresh: fetchLowStockNotifications,
    markAllAsRead,
    markAsRead,
  };
}
