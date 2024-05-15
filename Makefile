build:
	docker build -t chatgpttgbot .
run:
	docker run -d -p 4000:4000 --name chatgpttgbot --rm chatgpttgbot