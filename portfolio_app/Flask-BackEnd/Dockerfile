FROM python:3.9

WORKDIR /app

#RUN apt-get update && apt-get install -y \
#gcc \
#default-libmysqlclient-dev \
#pkg-config \
#&& rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

#EXPOSE 5000
#ENV FLASK_APP=server.py
#ENV FLASK_RUN_HOST=0.0.0.0

COPY . .

#CMD ["flask", "run"]

CMD ["python", "server.py"]
