---
theme: default
layout: cover
background: https://source.unsplash.com/1600x900/?circuitboard
---

# A Julian take on Embedded Software

Chinmay Pendharkar @ FOSSASIA 2023

---
layout: two-cols-header
---

# Hello 👋

::left::

<img src="https://pbs.twimg.com/media/Fshs6zCWIAAzy5j?format=jpg&name=small" class="pt-2 w-90 filter grayscale rounded" />

::right::

- I am Chinmay

- CTO @ Subnero

- Organizer @ Hackware

- ❤️ Hardware + Software

- @ntt@twitter.com

- @chinpen@mastodon.social

<!-- I'll start with a brief introduction. My name is Chinmay. I've worked for the last 15 years at the intersection of software and hardware. I'm currently the CTO at Subnero. I'm also the organizer of Hackware, a community of hardware hackers in Singapore. -->

---
layout: section
---

# The journey... 🚀

How we moved to using Julia for our Embedded Software...

<!-- Today, I want to share with your the journey we took at Subnero in moving to use Julia lang on our embedded systems. -->

---
layout: two-cols-header
---

# Subnero - Underwater WiFi 🛜

::left::

<img src="/modems.jpg" class="pt-5 pr-10 rounded" />

::right::

<v-clicks>

- Software Defined Underwater Modems

- Physical Devices (Jetson) + Embedded Linux

- Signal Processing + Numerical Computation

- UnetStack : Network stack customized for underwater networks

</v-clicks>

<!--

Let me first start with some context of what Subnero does. Subnero makes underwater wireless communication devices. These are physical devices which allow us send and receive data underwater using sound waves. We call them modems.

Subnero modems are software defined, which means most of the signal processing and numerical computing required for the communications is done in software. This is in contrast to traditional modems, where most of the signal processing and numerical computing is done in hardware (ASICs or FPGAs). Our devices are based on a nVidia Jetson SBC and run Embedded Linux.

Now since they are software defined, we need to be able to do all the signal processing and numerical computing in software in real time. Which means we need to finish processing the previous set of data before the new data arrives. -->

---
layout: two-cols-header
---

# UnetStack Requirements 👨🏽‍💻

::left::

<v-clicks>

- Software Defined

- Numerical Computation

- Signal Processing

- Hardware Integration

- In-field configuration

</v-clicks>

::right::

<v-clicks>

- => Embedded Linux

- => High Performance + "High Level" + GPU access

- => Low Latency + High Performance

- => "Low Level"

- => "Scriptable" + "High Level"

</v-clicks>

<!-- We developed software framework called UnetStack which is a custom network stack for underwater networks. UnetStack was originally designed in the early 2010s. It has an challenging set of requirements. So the question of which programming language we should use was a significant one. We had to consider the following:

Since UnetStack software defined, it has to be designed to be tweakable and adjustable in the field. So it makes sense to run it on some kind of an Embedded Linux.

UnetStack performs a lot of numerical compuatation for modulation and error correction, so we need something that's high performance and yet "high level". Higher level code is easier to maintain and iterate on.

UnetStack also does signal processing on incoming and outgoing acoustic signals, which needs to be done in real time (at low latency), but also with high performance. Some of our devices need to process 4 million samples of acoustic data per second continuously.

Since we work close to the hardware UnetStack needs to be able to talk to the hardware directly. We need to access peripherals like ADCs, DACs, GPIOs, regularly.

Finally, one of the features of our devices is to allow users to configure things in field, which means the software needs to "scriptable" and "updateable" in the field. -->

---
layout: default
---

# Older Solution - Java + C! ☕️

<v-clicks>

- Two language approach :

- **Java** for everything High Level & Performance & Scriptable

- **C** for everything High Performance & Low Level


</v-clicks>

<!-- With these constraints in mind, when we originally designed UnetStack, we took the 2 language approach.

We wrote the low level code in C and the high level code in Java/Groovy. Groovy for those who're not aware is a scriptable superset of Java that runs on the JVM.

While it might be a surprising choice for many, Java is pretty well suited for Embedded Systems. It's a high level language, it's scriptable (with Groovy) it can be made very performant and it takes very little memory. So we could easily run hardware with 512MB RAM. Also Android has shown that it's possible to run Java very well on small devices.

The low level code was written in C for low latency and high performance. -->

---
layout: default
---

# But.... 😖

- JNI was painful and rigid

- Very slow to iterate and improve the C codebase

<!-- This approach couldn't scale. The connection between Java and C, JNI, the Java Native Interface was painful to maintan. This made it harder to iterate and add feature to the C codebase. Also being so low level, there was a lot of C code and it became very hard to keep adding features and maintain across various hardware/OS revisions. -->

---
layout: section
---

# Here comes a new challenger! 🥋

<!-- So we had been looking for a different approach, when a few years ago we came across Julia. -->

---
layout:
---

# Who's Julia? 😜

<p></p>

- **Julia** (Julia lang) is a high-level, high-performance, dynamic programming language.

- Created at MIT in 2009.

- v1.0 released in 2018.

- Open Source (MIT License).

<img src="https://julialang.org/assets/infra/logo.svg" class="mx-auto w-50" />

<!--
Julia is a high level, high performance, dynamic programming language. It's was created at MIT in 2009 and finally reached v1.0 in 2018. It's a general purpose language, but it's particularly well suited for scientific computing and numerical computation. But we found it's actually pretty well suited for Embedded Systems too! -->

---
layout: default
---

# Julia (according to Julia) 🤓

<p></p>

**Fast**: Julia was designed from the beginning for high performance. Julia programs compile to efficient native code for multiple platforms via LLVM.

**General**: The standard library provides asynchronous I/O, process control, logging, profiling, a package manager, and more.

**Dynamic**: Julia is dynamically-typed, feels like a scripting language, and has good support for interactive use.

**Technical**: It excels at numerical computing with a syntax that is great for math, many supported numeric data types, and parallelism out of the box.

**Optionally typed**: Julia has a rich language of descriptive data types, and type declarations can be used to clarify and solidify programs.

<!-- Let's look at what Julia is great at. It's fast, it's high level, it uses LLVM in the back for native code generation. It's great for numerical computation and scientific computing. It's dynamic, which means it's easy to script and tweak in the field. -->

---
layout: default
---

# Julia (according to me) 😜

<p></p>

<v-clicks>

**Community** - Julia has a great community of developers and users.

**Open Source** - Lots of open source packages available.

**Low Level** - Very easy to interface with OS and hardware.

**GPU Integration** - Julia has great support for GPU programming.

**Performance Awareness** - Julia community cares a lot about speed and memory use.

~~**Easy to learn** - Julia is easy to learn and use.~~

</v-clicks>

<!-- More than what's on the webiste, to us Julia had a bunch of other advantages. Julia has a great community of developers. There are a lot of open source packages available. Especially around numerical computing and signal processing that we could use. It has a very easy low level interface to C libraries. And it has a great mechanism to scale computation to embedded GPUs (if available). And most importantly we found that the Julia community is very aware of speed and memory usage. There is great tooling around performance and memory usage. And there is constant effort to trying to optimize the core language and community packages.

And errr.. it has a pretty steep learning curve.. :( Personally, it took me a while to get my mind around how multiple-dispatch works in Julia. But once you get it, it's pretty awesome.

So we decided to adopt Julia in UnetStack. We started by replacing various components and tooling in UnetStack with Julia. -->

---
layout: default
---

# What worked? 🤩

**Speed of development** - Julia is a great language rapidly developing high performance code.

```julia {3,4}
while true
    rd = read!(ADC, buffer)
    resize!(data, rd >> 2)
    data .= (reinterpret(Int32, @view buffer[1:rd]) .>> 8) ./ INPUT_MAX
    callback(data)
end
```

<!-- We really enjoyed the benefits of Julia on speed of development. I took this code out of a components which needs to read data out of a ADC into a buffer, frame it and send it for further processing. The first highlighted line resizes the data array so that we don't have to reallocate on every read. And the second highlighted line takes the 32bit integer buffer, drops the last 8 bits (which are the status bits), and reinterpret it as a 24bit integer and normalizes it to the max value before copying it into the data array and sending it for further processing.

While it looks pretty easy to reason with, the great this about this code it that it doesn't do any allocations and once compiled it generates a pretty efficient machine code which allows us to run this snippet continuously at 4 million samples per second. -->

---
layout: default
---

# What worked? 🤩

**Low level control** - Almost as easy as C to deal with hardware (I2C, SPI, UART, GPIO, etc.)

```julia{1|5-10|14-18}
ioctl(f, req, val) = ccall((:ioctl, libc[]), Cint, (Cint, Culong, Culong...), Int32(fd(f)), req, val)

...

mutable struct Data
  read_write::UInt8
  command::UInt8
  size::UInt32
  data::Ptr{UInt8}
end

...

open("/dev/i2c-7", "r+") do io
    ioctl(io, I2C_SLAVE, addr)
    id = Data(I2C_SMBUS_WRITE, command, size, pointer(data))
    ioctl(io, I2C_SMBUS, pointer_from_objref(id))
end
```

<!-- We also found that it was very simple to hook into native libraries from Julia. Julia has a `ccall` and also defines most of the common C types. So it's pretty easy to call into native libraries. In this example, we have a Julia function which makes a `IOCTL` system call to write data to an I2C bus. With that single line function call defined, we can now use it from Julia to very easily write to I2C devices. -->

---
layout: default
---

# What worked? 🤩

**GPU access** - Julia has great support for GPU programming.

```julia{1-6|8|10}
function vector_mul!(x, y, out)
    for i = 1:length(x)
        @inbounds out[i] = x[i] * y[i]
    end
    return nothing
end

vector_mul([1,2,3], [4,5,6], [0,0,0])

@cuda vector_mul([1,2,3], [4,5,6], [0,0,0])
```

<!-- We also were finally able to easily use the GPU we had onboard our platform without jumping through complex hoops trying to compile and access CUDA from it's C APi. -->

---
layout: default
---

# What didn't work? 😞

**Threading and Scheduling** - Julia didn't have much granular user control over threads and scheduling.

<v-clicks>

- A software defined modem needs to process lots of data in real time. 🏃‍♂️

- Julia uses Green Threads! 😱

- Julia does depth first scheduling! 😱

- Julia didn't (< v1.7) have much control over task scheduling and priority.

- Julia v1.9 has some improvements in this area...

</v-clicks>

<v-clicks>

> `Threads.@spawn` now accepts an optional first argument: `:default` or `:interactive`. An interactive task desires low latency and implicitly agrees to be short duration or to yield frequently. Interactive tasks will run on interactive threads, if any are specified when Julia is started.

</v-clicks>

<!-- But not everything is perfect. There are some things that we found that didn't work so well.

Julia, at least when we initially started using it expose much control to the user for threading and scheduling. Julia uses green threads, which are called Tasks. The Tasks are scheduled depth first. Which is great for heavy numerical computing loads, but not so great for low latency or real time computation. We had to find creative ways to work around this initially so that we could have the task reading from the ADC (the code I showed earlier) be scheduled continuously.

Some of these issues are well known and are being solved at a language level. For example the upcoming Julia 1.9 release will have a new threading mode which allows use to mark some Tasks as "interactive" and they will be scheduled on dedicated threads which are given priority. -->

---
layout: default
---

# What didn't work? 😞

**Painful Deployment Story** - Julia doesn't have a standard approach to bundling and deploying applications.

 _Nothing a bit of `rsync` can't solve!!_ 😱 😱 😱

<Youtube id="s6pjxCuNGjc" height="75%" width="75%" class="mx-auto pt-3"/>

<!-- Another issue we faced was that Julia doesn't have a deployment story. There is no standardised approach for bundling up a Julia application and deploying it to a target. There are a bunch of tools that the community has built around it, but none of them have critical mass and support to be the standard.

The Julia community knows this though. In fact at the last annual Julia conference one of the keynotes was exactly about this. There work being done to address this and hopefully there will be a standard deployment story soon. -->

---
layout: default
---

# What didn't work? 😞
**Warm up time** - Julia takes a while to warm up and compile code when it first runs.

<v-clicks>

- Julia is a JIT compiled by default.

- Functions are compiled the first time they're called.

- A large application takes can take minutes to start up. 😱 😱 😱

- System images work withsome success.

- Julia 1.9 will cache compiled code to disk.

</v-clicks>


<!-- And finally, just like Java (but also worst than Java) Julia takes a significant time to warm up. Julia is JIT compiled so it only compiles the specific version of a function when it encounters them for the first time. Which means it takes a long time to start up since it needs to compile many functions.

This is also a well known problem in the community and many tool exist to work around it. There are tools to precompile libraries or packages using their tests as a driver. There are tools which will dump out the compiled native code (called system image) so that it can be used at the next boot.

Julia 1.9 has builtin native code caching to disk, so it will cache the native code for a function and reuse it the next time it's called even if it's during the next boot. While not a perfect solution, it's a step in the right direction. Hopefully we will have more solutions in this area in the future. -->

---
layout: default
---

# What else could have worked? 🤔

<p></p>

<v-clicks>

- **Rust** - Everyone ❤️s Rust. But there isn't that much community around signal processing and numerical computation in Rust (yet?).

- **Go** - Same same...

- **??** - ???

</v-clicks>

<!-- While preparing this though, I wondered now that we have made this jump, what else could have worked instead of Julia?

Whenever I talk about this to anyone, everyone jumps up and down and says, RUST! You should use Rust!. Everyone loves Rust. We did look at rust, but the Julia's ecosystem of packages around numerical computing and signal processing was much more valuable to our use case.

I did look at Go as well. While we found the multi threading model to be very applicable for what we needed, it also doesn't have the ecosystem of packages that we needed.

And what else, if you think there are better languages to solve these problems in, I would love to know. I'll be around FOSSASIA today, so please come and talk to me. -->

---
layout: default
---

# So where we now? 📈

<p></p>

<v-clicks>

- 100% of low level code is in Julia. 🙌

- Much of the high level code is still in Java/Groovy (for now). 😟

- Most of the tooling is slowly moving to Julia. 📈

- Most new code is written in Julia. 🤩

- Embedded firmware is still in C. 😞

</v-clicks>

<!-- So where do we stand with UnetStack today? Most of the low level code is already in Julia. We're in the process of replacing the high level code with Julia as well. We have some of the tooling to Julia. And most importantly, most of the new code is being written in Julia.

Unfortunately, the firmware code is still in C. Rust is likely a better candidate there, but we haven't had the time to make the switch yet. -->

---
layout: default
---

# Take Away! 🎯

<p></p>

<v-clicks>

- Julia is not just for large computers.

- Julia works really well on small embedded systems too.

- Some teething problems but they're being solved. 🤞🏽

</v-clicks>

<!-- So what's the TLDR here??

1. Julia isn't only for large computers. It can work well on those.

2. But Julia can work pretty well on Embedded Systems as well.

3. Julia does have some teething problems, but the community is well aware of them and actively working on them. -->

---
layout: default
---

# We're Hiring! 🤝

<p></p>

- ❤️ Hardware + Software ?

- Want to help build the future of underwater wireless?

- Check out our https://subnero.com/careers/

<img src="/subnero.png" class="w-35 mx-auto pt-30" />

<!-- Oh and I forgot to mention, we're hiring at Subnero. If you like the stuff I talked about today, if you love to work at the intersection of hardware and software or want to help build the future of underwater communications, please come talk to me.

And also I have some Subnero and Julia lang stickers to give away. So please come and talk to me. If you have any questions, please come and talk to me. I'll be around FOSSASIA today. -->