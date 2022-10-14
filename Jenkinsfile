pipeline {
  agent any
  tools {nodejs "Node"}
 
  stages {
      stage('Code Analysis') {
          environment {
    SCANNER_HOME = tool 'SonarScanner'
    PROJECT_NAME = "WMSWEB"
  }
  steps {
    withSonarQubeEnv('SonarQube Server') {
        sh '''$SCANNER_HOME/bin/sonar-scanner 
           '''
    }
  }
 }
    
        stage("Quality Gate") {
            steps {
                timeout(time: 1, unit: 'HOURS') { 
                  
                  waitForQualityGate abortPipeline: true
                }
            }
        }

    
  }
}
