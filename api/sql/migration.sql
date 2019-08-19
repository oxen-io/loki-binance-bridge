alter table swaps add column if not exists deposit_transaction_created timestamp;
update swaps set deposit_transaction_created = COALESCE(created) where deposit_transaction_created is null;
