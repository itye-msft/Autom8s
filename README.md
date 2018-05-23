# Dynamically and automatically deploy applications to kubernetes cluster and expose them externally

The sample app provides a template which can perform the following:

1. An HTTP wrapper to execute helm commands from inside the cluster, and deploy new applications.
2. Expose applications externally via existing external IP and dynamically allocated port.