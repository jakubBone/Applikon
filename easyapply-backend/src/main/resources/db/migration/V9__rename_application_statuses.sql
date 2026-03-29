UPDATE applications SET status = 'SENT'        WHERE status = 'WYSLANE';
UPDATE applications SET status = 'IN_PROGRESS'  WHERE status IN ('W_PROCESIE', 'ROZMOWA', 'ZADANIE');
UPDATE applications SET status = 'OFFER'        WHERE status = 'OFERTA';
UPDATE applications SET status = 'REJECTED'     WHERE status IN ('ODMOWA', 'ODRZUCONE');
