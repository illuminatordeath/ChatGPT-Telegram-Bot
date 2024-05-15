build:
	docker build -t chatgpttgbot .
run:
	docker run -d -p 3000:3000 --name chatgpttgbot --rm chatgpttgbot