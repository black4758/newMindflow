pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_FILE = "docker-compose.yml"
    }

    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "Checking out branch: ${env.BRANCH_NAME}"
                    checkout scm
                }
            }
        }

        stage('Build Backend') {
            steps {
                script {
                    echo "Building Spring Boot application..."
                    sh 'cd backend && ./gradlew clean build -x test' // 테스트 제외 빌드
                }
            }
        }

        stage('Build Frontend') {
            steps {
                script {
                    echo "Building React application..."
                    sh 'cd frontend && npm install && npm run build'
                }
            }
        }

        stage('Deploy with Docker') {
            steps {
                script {
                    echo "Deploying with Docker Compose..."
                    sh 'docker-compose down'
                    sh 'docker-compose up --build -d'
                }
            }
        }
    }

    post {
        success {
            echo "Deployment successful!"
        }
        failure {
            echo "Deployment failed!"
        }
    }
}
