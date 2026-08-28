DELETE FROM "PaymentMethod" WHERE "channel" = 'Zelle';
UPDATE "PaymentMethod" SET "channel" = 'Zelle', "details" = 'Account Number / Phone: +12673998390 | Name on Account: Olaoluwa Oladele', "usage" = 'Zelle deposits and withdrawals', "updatedAt" = CURRENT_TIMESTAMP WHERE "channel" = 'Venmo';

DELETE FROM "ExchangeRate" WHERE "service" = 'Zelle';
UPDATE "ExchangeRate" SET "service" = 'Zelle', "updatedAt" = CURRENT_TIMESTAMP WHERE "service" = 'Venmo';
