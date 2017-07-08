#!/usr/bin/env bash
set -ux

readonly VERSION="1.0"

AWS_DEFAULT_REGION=ap-northeast-1
AWS_ECS_TASKDEF_NAME=okimochi
AWS_ECS_CLUSTER_NAME=okimochi-cluster
AWS_ECS_SERVICE_NAME=okimochi-service
AWS_ECR_REP_NAME=okimochi
AWS_ACCOUNT_ID=894559805305

# Create Task Definition
make_task_def(){
	task_template='[
      {
        "name": "%s",
        "image": "%s.dkr.ecr.%s.amazonaws.com/%s:%s",
        "essential": true,
        "memory": 200,
        "cpu": 10,
        "portMappings": [
          {
            "containerPort": 3000,
            "hostPort": 3000
          }
        ],
        "links": [
          "bitcoind:bitcoind",
          "mongo:mongo"
        ],
        "environment": {
          "name": "TOKEN",
          "value": "%s"
        }],
      },


      {
        "memory": 200,
        "portMappings": [
            {
              "hostPort": 27017,
              "containerPort": 27017,
              "protocol": "tcp"
            },
            {
              "hostPort": 28017,
              "containerPort": 28017,
              "protocol": "tcp"
            }
        ],
        "essential": true,
            "entryPoint": [
                "mongod",
                "--dbpath=/data/db"
            ],
            "mountPoints": [
                {
                    "containerPath": "/data/db",
                    "sourceVolume": "userdb",
                }
            ],
            "name": "mongo",
            "image": "mongo:3.4.5",
            "cpu": 1,
        },

         {
            "portMappings": [
                {
                    "hostPort": 8332,
                    "containerPort": 8332,
                    "protocol": "tcp"
                },
                {
                    "hostPort": 8333,
                    "containerPort": 8333,
                    "protocol": "tcp"
                },
                {
                    "hostPort": 18332,
                    "containerPort": 18332,
                    "protocol": "tcp"
                },
                {
                    "hostPort": 18333,
                    "containerPort": 18333,
                    "protocol": "tcp"
                }
            ],
            "essential": true,
            "entryPoint": [
                "bitcoind",
                "-printtoconsole",
                "-rest",
                "-testnet",
                "-server",
                "-rpcallowip=172.0.0.0/8",
                "-rpcuser=slackbot",
                "-rpcpassword=bitcoin-tipper"
            ],
            "mountPoints": [
                {
                    "containerPath": "/home/bitcoin/.bitcoin",
                    "sourceVolume": "bitcoind",
                }
            ],
            "name": "bitcoind",
            "image": "seegno/bitcoind:0.14.2-alpine",
            "cpu": 2,
            "memoryReservation": 3000
        },
]'

	task_def=$(printf "$task_template" ${AWS_ECS_TASKDEF_NAME} \
      $AWS_ACCOUNT_ID ${AWS_DEFAULT_REGION} ${AWS_ECR_REP_NAME} $CIRCLE_SHA1 ${TOKEN})
}

# more bash-friendly output for jq
JQ="jq --raw-output --exit-status"

configure_aws_cli(){
	aws --version
	aws configure set default.region ${AWS_DEFAULT_REGION}
	aws configure set default.output json
}

deploy_cluster() {

    make_task_def
    register_definition
    if [[ $(aws ecs update-service --cluster ${AWS_ECS_CLUSTER_NAME} --service ${AWS_ECS_SERVICE_NAME} \
      --task-definition $revision | \
                   $JQ '.service.taskDefinition') != $revision ]]; then
        echo "Error updating service."
        return 1
    fi

    # wait for older revisions to disappear
    # not really necessary, but nice for demos
    for attempt in {1..30}; do
        if stale=$(aws ecs describe-services --cluster ${AWS_ECS_CLUSTER_NAME} --services ${AWS_ECS_SERVICE_NAME} | \
                       $JQ ".services[0].deployments | .[] | select(.taskDefinition != \"$revision\") | .taskDefinition"); then
            echo "Waiting for stale deployments:"
            echo "$stale"
            sleep 5
        else
            echo "Deployed!"
            return 0
        fi
    done
    echo "Service update took too long."
    return 1
}


push_ecr_image(){
	eval $(aws ecr get-login --region ${AWS_DEFAULT_REGION})
	docker push $AWS_ACCOUNT_ID.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com/${AWS_ECR_REP_NAME}:$CIRCLE_SHA1
}

register_definition() {

    if revision=$(aws ecs register-task-definition --container-definitions "$task_def" --family ${AWS_ECS_TASKDEF_NAME} | $JQ '.taskDefinition.taskDefinitionArn'); then
        echo "Revision: $revision"
    else
        echo "Failed to register task definition"
        return 1
    fi

}

configure_aws_cli
push_ecr_image
deploy_cluster

