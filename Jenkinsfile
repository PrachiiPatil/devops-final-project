pipeline {
    agent any

    tools {
        maven 'Maven-3'   
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-creds')       // Username+password credential
        DOCKER_IMAGE           = "prachiip/tic-tac-toe"
        IMAGE_TAG              = "${env.BUILD_NUMBER}"
        KUBE_NAMESPACE          = "tic-tac-toe"
        SONARQUBE_ENV           = "sonarqube"                        // Name from Manage Jenkins -> System -> SonarQube servers
        NEXUS_URL                = "http://13.207.195.85:8081"
        NEXUS_REPO               = "docker-repo"
        NEXUS_CREDENTIALS_ID     = "nexus-creds"
    }

    stages {

        stage('Clone Code') {
            steps {
                git branch: 'main', url: 'https://github.com/PrachiiPatil/devops-final-project.git'
            }
        }

        stage('Maven Validate') {
            steps {
                sh 'mvn validate'
            }
        }

        stage('Maven Compile') {
            steps {
                sh 'mvn compile'
            }
        }

        stage('Maven Test') {
            steps {
                sh 'mvn test'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv("${SONARQUBE_ENV}") {
                    sh 'mvn sonar:sonar'
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Maven Build') {
            steps {
                sh 'mvn clean package -DskipTests'
            }
        }

        stage('Trivy FS Scan') {
            steps {
                sh 'trivy fs --exit-code 0 --severity HIGH,CRITICAL --format table -o trivy-fs-report.txt .'
            }
        }

        stage('Upload Artifact to Nexus') {
            steps {
                nexusArtifactUploader(
                    nexusVersion: 'nexus3',
                    protocol: 'http',
                    nexusUrl: "13.207.195.85:8081",
                    groupId: 'com.devops.project',
                    version: "${IMAGE_TAG}",
                    repository: 'maven-releases',
                    credentialsId: "${NEXUS_CREDENTIALS_ID}",
                    artifacts: [
                        [artifactId: 'tic-tac-toe', classifier: '', file: 'target/tic-tac-toe.war', type: 'war']
                    ]
                )
            }
        }

        stage('Docker Build') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${IMAGE_TAG} ."
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh "trivy image --exit-code 0 --severity HIGH,CRITICAL --format table -o trivy-image-report.txt ${DOCKER_IMAGE}:${IMAGE_TAG}"
            }
        }

        stage('Push Image to Docker Hub') {
            steps {
                script {
                    sh "docker tag ${DOCKER_IMAGE}:${IMAGE_TAG} ${DOCKER_IMAGE}:latest"
                    sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                    sh "docker push ${DOCKER_IMAGE}:${IMAGE_TAG}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                withKubeConfig(credentialsId: 'k8s-kubeconfig', serverUrl: '') {
                    sh """
                        sed -i 's|IMAGE_PLACEHOLDER|${DOCKER_IMAGE}:${IMAGE_TAG}|g' k8s/deployment.yaml
                        kubectl apply -f k8s/deployment.yaml -n ${KUBE_NAMESPACE}
                        kubectl apply -f k8s/service.yaml -n ${KUBE_NAMESPACE}
                        kubectl rollout status deployment/tic-tac-toe -n ${KUBE_NAMESPACE} --timeout=120s
                    """
                }
            }
        }
    }

    post {
        success {
            emailext(
                subject: "SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: """<p>Build & Deployment SUCCESSFUL</p>
                         <p>Job: ${env.JOB_NAME}</p>
                         <p>Build Number: ${env.BUILD_NUMBER}</p>
                         <p>Image: ${DOCKER_IMAGE}:${IMAGE_TAG}</p>
                         <p>Console: <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>""",
                to: "your-team@example.com",
                mimeType: 'text/html'
            )
        }
        failure {
            emailext(
                subject: "FAILED: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: """<p>Build or Deployment FAILED</p>
                         <p>Job: ${env.JOB_NAME}</p>
                         <p>Build Number: ${env.BUILD_NUMBER}</p>
                         <p>Console: <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>""",
                to: "your-team@example.com",
                mimeType: 'text/html'
            )
        }
        always {
            sh 'docker logout || true'
            archiveArtifacts artifacts: 'trivy-*.txt', allowEmptyArchive: true
        }
    }
}
