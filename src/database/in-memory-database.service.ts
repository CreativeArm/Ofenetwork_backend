import { Injectable } from "@nestjs/common";
import {
  AuditLog,
  Buy4MeOrder,
  Notification,
  Transaction,
  User,
  Wallet,
} from "../types/domain";

@Injectable()
export class InMemoryDatabaseService {
  users: User[] = [];
  wallets: Wallet[] = [];
  transactions: Transaction[] = [];
  notifications: Notification[] = [];
  buy4meOrders: Buy4MeOrder[] = [];
  auditLogs: AuditLog[] = [];
}
