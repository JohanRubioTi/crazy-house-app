-- Insert test data for clients
INSERT INTO public.clients (user_id, name, contact) VALUES
('your-user-id-1', 'Juan Test', '3001112222'),
('your-user-id-1', 'Maria Test', '3002223333'),
('your-user-id-2', 'Carlos Test', '3004445555'); -- Another user

-- Insert test data for motorcycles for client Juan Test
INSERT INTO public.motorcycles (user_id, client_id, make, model, plate) VALUES
('your-user-id-1', (SELECT id FROM public.clients WHERE name = 'Juan Test' AND user_id = 'your-user-id-1'), 'Yamaha', 'R15 Test', 'TEST123'),
('your-user-id-1', (SELECT id FROM public.clients WHERE name = 'Juan Test' AND user_id = 'your-user-id-1'), 'Honda', 'CBR250 Test', 'TEST456');

-- Insert test data for motorcycles for client Maria Test
INSERT INTO public.motorcycles (user_id, client_id, make, model, plate) VALUES
('your-user-id-1', (SELECT id FROM public.clients WHERE name = 'Maria Test' AND user_id = 'your-user-id-1'), 'Suzuki', 'GSX-R150 Test', 'TEST789');
