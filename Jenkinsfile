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
        stage('Debug Environment') {
            steps {
                script {
                    echo "Debugging Jenkins environment variables..."
                    sh 'env'
                }
            }
        }

        stage('Build with Docker') {
            steps {
                script {
                    echo "Building and Deploying with Docker Compose..."
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
