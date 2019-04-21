export class SpringBackendRunner {

    private JVM_LOCATION = `${process.cwd()}/dependencies/jvm/bin/java`;

    public printJvmLocation() {
        console.log(this.JVM_LOCATION);
    }

}