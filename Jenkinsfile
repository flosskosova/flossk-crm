pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    parameters {
        string(name: 'DEPLOY_BRANCH', defaultValue: 'main', description: 'Branch allowed to deploy to staging')
        string(name: 'DEPLOY_HOST', defaultValue: 'root.flossk.org', description: 'SSH host for deployment (staging points to same server)')
        string(name: 'DEPLOY_USER', defaultValue: 'deploy', description: 'SSH username on deployment host')
        string(name: 'REMOTE_APP_DIR', defaultValue: '/opt/flossk', description: 'Absolute path of app repository on deployment host')
    }

    environment {
        STAGING_DOMAIN = 'staging.root.flossk.org'
        SSH_CREDENTIALS_ID = '0b1e52e8-4bd3-4e2c-a439-3e13cb19adba'
        DOTNET_CLI_TELEMETRY_OPTOUT = '1'
        DOTNET_SKIP_FIRST_TIME_EXPERIENCE = '1'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Run Backend Tests') {
            steps {
                dir('flossk-ms') {
                    sh '''
                        set -euxo pipefail
                        DOTNET_CMD="dotnet"

                        if ! command -v dotnet >/dev/null 2>&1; then
                            echo "dotnet SDK not found on agent. Installing .NET 10 SDK locally in workspace..."
                            curl -fsSL https://dot.net/v1/dotnet-install.sh -o "$WORKSPACE/dotnet-install.sh"
                            bash "$WORKSPACE/dotnet-install.sh" --channel 10.0 --install-dir "$WORKSPACE/.dotnet"
                            DOTNET_CMD="$WORKSPACE/.dotnet/dotnet"
                        fi

                        "$DOTNET_CMD" --info
                        "$DOTNET_CMD" restore FlosskMS.slnx
                        "$DOTNET_CMD" test FlosskMS.slnx --configuration Release --no-restore --verbosity minimal
                    '''
                }
            }
        }

        stage('Deploy To Staging') {
            when {
                allOf {
                    expression { env.BRANCH_NAME == params.DEPLOY_BRANCH }
                    not { changeRequest() }
                }
            }
            steps {
                sshagent(credentials: [env.SSH_CREDENTIALS_ID]) {
                    sh '''
                        set -euxo pipefail
                        ssh -o StrictHostKeyChecking=accept-new "${DEPLOY_USER}@${DEPLOY_HOST}" "set -euxo pipefail; \
                            cd '${REMOTE_APP_DIR}'; \
                            git fetch --all --prune; \
                            git checkout '${DEPLOY_BRANCH}'; \
                            git pull --ff-only origin '${DEPLOY_BRANCH}'; \
                            DOMAIN='${STAGING_DOMAIN}' docker compose -f docker-compose.prod.yml --env-file .env up -d --build; \
                            docker compose -f docker-compose.prod.yml ps"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully. Staging should be available at https://${env.STAGING_DOMAIN}"
        }
        failure {
            echo 'Pipeline failed. Deployment to staging was skipped.'
        }
    }
}