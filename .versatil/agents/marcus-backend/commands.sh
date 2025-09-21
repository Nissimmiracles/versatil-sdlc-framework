#!/bin/bash
# Marcus-Backend Commands

marcus_security() {
    echo "⚙️ Running security audit..."
    npm audit
    snyk test
}

marcus_api_test() {
    echo "⚙️ Testing API endpoints..."
    newman run api-tests.postman_collection.json
}

marcus_docker() {
    echo "⚙️ Managing Docker containers..."
    docker-compose up -d
}