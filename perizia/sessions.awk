BEGIN{gap=int(5400*m);ramp=int(1800*m)}
{if(prev!=""&&$1-prev>gap){tot+=(prev-start)+ramp;sess++;start=$1}
 if(prev==""){sess++;start=$1}
 prev=$1}
END{tot+=(prev-start)+ramp;printf "fattore %s: sessioni=%d ore=%.1f\n",m,sess,tot/3600}
